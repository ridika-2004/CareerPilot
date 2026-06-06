import os
import json
import time
import re
from google import genai
from google.genai import errors
from dotenv import load_dotenv
from cv.services.embed_store import query_cv, collection as cv_collection
from .job_sources import fetch_all_jobs

load_dotenv()


def _extract_location_keywords(query):
    """Extract likely location names from ANY natural-language search query.
    Universal approach — works for any city, country, or region:
    1. Words after 'in / near / from / around / at' → treated as locations
    2. Capitalized proper nouns → treated as potential locations
    3. Special work-mode terms (remote, worldwide, hybrid, on-site) → tracked separately
    """
    q = query.lower().strip()
    # Words that should NOT be treated as locations even if they follow 'in' etc.
    STOP = {
        "the", "a", "an", "this", "next", "which", "that", "their", "them",
        "my", "your", "our", "his", "her", "its", "with", "without",
        "need", "needs", "looking", "search", "find", "want", "get",
    }
    # Job/tech terms that aren't locations
    ROLE_WORDS = {
        "remote", "hybrid", "on-site", "onsite", "wfh",
        "full-time", "part-time", "contract", "freelance", "internship",
        "junior", "senior", "mid", "lead", "staff", "principal",
        "backend", "frontend", "fullstack", "full-stack", "devops", "sre",
        "ml", "ai", "data", "dev", "qa", "ui", "ux", "ios", "android",
        "engineer", "developer", "designer", "analyst", "manager", "intern",
        "software", "web", "mobile", "cloud", "security", "product",
        "python", "java", "javascript", "react", "node", "golang", "rust",
        "this", "month", "week", "year", "today", "now", "soon",
    }
    found_locations = set()
    work_modes = set()  # remote, hybrid, on-site etc.

    # 1. Words after prepositions: "in Dhaka", "near Berlin", "from USA"
    loc_phrases = re.findall(
        r'(?:in|near|from|around|at)\s+([a-z][a-z\s]{1,30}?)(?=\s+(?:open|this|next|that|which|with|for|salary|remote|on-site|hybrid|full|part|intern|junior|senior|mid|lead|staff|principal|backend|frontend|fullstack|ml|ai|data|dev|engineer|developer|internship|job|role|position|work)\b|$|\?|\.|,)',
        q
    )
    for phrase in loc_phrases:
        phrase = phrase.strip()
        if not phrase:
            continue
        words = phrase.split()
        # Remove trailing stop words
        while words and words[-1] in STOP:
            words.pop()
        phrase = " ".join(words)
        if not phrase:
            continue
        # Check if it's a work mode
        if phrase in {"remote", "hybrid", "on-site", "onsite", "wfh", "work from home"}:
            work_modes.add(phrase)
        elif phrase not in ROLE_WORDS and not all(w in STOP for w in words):
            found_locations.add(phrase)

    # 2. Capitalized proper nouns from original query (potential place names)
    cap_words = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b', query)
    for word in cap_words:
        wl = word.lower()
        if wl in {"remote", "hybrid", "onsite", "on-site", "wfh"}:
            work_modes.add(wl)
        elif wl not in STOP and wl not in ROLE_WORDS:
            found_locations.add(wl)

    # 3. Check for work-mode terms in the lowercased query
    for term in ("remote", "hybrid", "on-site", "onsite", "wfh", "work from home",
                 "worldwide", "global", "anywhere"):
        if term in q:
            work_modes.add(term)

    # If user ONLY asked for a work mode (e.g. "remote ML jobs"), use that as location keyword
    if work_modes and not found_locations:
        return list(work_modes)

    # Include work modes alongside locations so both get classified
    return list(found_locations | work_modes)


def _classify_location_match(job_location, job_title, query_location_keywords):
    """Classify a job's location relevance to the user's query.
    Returns: 'exact' | 'remote' | 'other'
    Works for ANY location the user mentions.
    """
    if not query_location_keywords:
        return "other"
    loc = (job_location or "").lower()
    title = (job_title or "").lower()
    loc_words = set(loc.replace(",", " ").replace("/", " ").replace("-", " ").split())

    WORK_MODES = {"remote", "worldwide", "global", "anywhere",
                  "work from home", "wfh", "hybrid"}

    for kw in query_location_keywords:
        kw_lower = kw.lower()

        # Work-mode keywords: remote, hybrid, worldwide, anywhere, etc.
        if kw_lower in WORK_MODES:
            if any(w in loc for w in WORK_MODES):
                return "exact"
            continue

        # City / country / region name
        # Direct full-phrase match: "dhaka" in "Dhaka, Bangladesh"
        if kw_lower in loc or kw_lower in title:
            return "exact"

        # Split multi-word keywords and try each word individually
        # e.g. "munich germany" → try "munich" and "germany" separately
        kw_parts = kw_lower.split()
        for part in kw_parts:
            if len(part) < 2:
                continue
            # Check against each word in the job location
            for lw in loc_words:
                if lw == part or lw.startswith(part) or part.startswith(lw):
                    return "exact"
            # Also check title
            if part in title:
                return "exact"

    # If not exact match, check if the job is remote (still useful from any location)
    if any(w in loc for w in WORK_MODES):
        return "remote"
    return "other"

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Models to try in order (each has its own free-tier quota)
FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"]


def call_gemini(prompt, config=None, max_retries=2):
    """Call Gemini with automatic retry on 429 and model fallback."""
    models_to_try = ["gemini-2.5-flash"] + FALLBACK_MODELS
    last_error = None

    for model in models_to_try:
        for attempt in range(max_retries + 1):
            try:
                if config:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=config
                    )
                else:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                return response
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower():
                    # Extract retry delay from error message
                    retry_delay = 5 * (attempt + 1)  # default backoff
                    # Try to parse "retry in Xs" from error
                    import re
                    match = re.search(r'retry in ([\d.]+)s', err_str)
                    if match:
                        retry_delay = min(float(match.group(1)) + 1, 60)

                    if attempt < max_retries:
                        print(f"Gemini 429 quota hit on {model}, retrying in {retry_delay:.0f}s (attempt {attempt+1}/{max_retries})")
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Try next model
                        print(f"Gemini 429 quota exhausted for {model}, trying fallback model...")
                        break
                else:
                    # Non-quota error — re-raise immediately
                    raise
    # All models exhausted
    raise Exception(
        f"All Gemini models have exhausted their daily quota. "
        f"Last error: {last_error}. "
        f"The free tier allows 20 requests/day per model. "
        f"Please wait for the quota to reset (resets daily) or upgrade to a paid plan."
    )

SYSTEM_PROMPT = """
You are CareerPilot — a deeply personalized AI career assistant.

You MUST follow these rules strictly:

1. ALWAYS ground your answers in the user's real CV context provided below. Never fabricate experience, skills, or projects they don't have.
2. If something is NOT in their CV, say so honestly and suggest how to build it.

3. If user asks: "Am I ready for a data engineer role?" or similar readiness question:
   → Give a clear VERDICT (ready / not yet / almost ready)
   → Reasoning grounded in their specific CV (skills, experience, projects)
   → Concrete gaps (missing skills, missing experience types)
   → Actionable improvement plan with realistic timelines

4. If user asks: "What skills am I missing for a Google internship?" or similar gap analysis:
   → Benchmark what top companies typically require
   → Compare against the user's actual CV
   → List exactly which skills/experience are missing
   → Suggest specific resources (courses, projects, certifications) to fill each gap

5. If user asks: "Build me a 3-month roadmap to become job-ready":
   → Create a structured weekly plan (Week 1–12)
   → Each week should have clear learning goals, resources, and deliverables
   → Reference the user's existing skills as a starting point
   → Include milestones and checkpoints

6. If user asks: "Draft a cover letter for this job posting":
   → Write a personalized cover letter that references the user's ACTUAL experience, projects, and skills
   → Match the job requirements to what's on their CV
   → Be professional, concise, and compelling — no generic fluff

7. For any other career question — answer using their CV as the primary evidence base.

8. Be concise, structured with headings/bullets, and professional.
9. Always respond in Markdown.
10. Do NOT use LaTeX or code blocks.
11. No upload or download links, only text-based responses.
"""


def get_cv_context(user_id):
    """Retrieve CV context from ChromaDB for a user. Returns formatted string or None."""
    try:
        cv_chunks = query_cv(user_id, "skills experience education projects summary", top_k=10)
        if not cv_chunks:
            return None
        return "\n\n---\n\n".join(
            f"[{c['section'].upper()}]\n{c['content']}" for c in cv_chunks
        )
    except Exception as e:
        print(f"Error retrieving CV context for user {user_id}: {e}")
        return None


def generate_reply(messages, user_id=None):
    cv_context = None
    if user_id:
        cv_context = get_cv_context(user_id)

    prompt = SYSTEM_PROMPT
    if cv_context:
        prompt += f"\n\nUSER'S CV (retrieved from vector database):\n{cv_context}\n"
    else:
        prompt += "\n\nNote: No CV has been uploaded yet. Advise the user to upload their CV on the Profile page for fully personalized responses."

    prompt += "\n\nConversation:\n"
    for msg in messages:
        role = "User" if msg.role == "user" else "Assistant"
        prompt += f"{role}: {msg.content}\n"

    response = call_gemini(prompt)

    return response.text


def hunt_jobs(query, user_id):
    # 1. Extract location intent from the user's query
    location_keywords = _extract_location_keywords(query)
    print(f"[HuntJobs] Query='{query}' | Detected location keywords={location_keywords}")

    # 2. Fetch real jobs from live APIs
    real_jobs = fetch_all_jobs(query, limit_per_source=20)

    if not real_jobs:
        return {"jobs": []}

    # 3. Try to get CV context from ChromaDB (optional — jobs still work without CV)
    cv_context = None
    has_cv = False
    try:
        cv_chunks = query_cv(user_id, query, top_k=8)
        if not cv_chunks:
            all_data = cv_collection.get(where={"user_id": user_id})
            if all_data["ids"]:
                cv_chunks = query_cv(user_id, "skills experience education projects", top_k=8)
        if cv_chunks:
            cv_context = "\n\n---\n\n".join(
                f"[{c['section'].upper()}]\n{c['content']}" for c in cv_chunks
            )
            has_cv = True
    except Exception as e:
        print(f"[HuntJobs] CV retrieval error (non-fatal): {e}")

    # 4. Classify each job by location relevance (used in both CV and no-CV paths)
    for j in real_jobs:
        j["location_tier"] = _classify_location_match(
            j.get("location", ""), j.get("title", ""), location_keywords
        )

    # 4b. Sort ALL fetched jobs by location tier so best matches bubble up before truncation
    tier_order = {"exact": 0, "remote": 1, "other": 2}
    real_jobs.sort(key=lambda x: tier_order.get(x.get("location_tier", "other"), 2))

    print(f"[HuntJobs] Total jobs fetched: {len(real_jobs)} | Tiers: exact={sum(1 for j in real_jobs if j.get('location_tier')=='exact')}, remote={sum(1 for j in real_jobs if j.get('location_tier')=='remote')}, other={sum(1 for j in real_jobs if j.get('location_tier')=='other')}")

    # 5. If no CV, return real jobs sorted by query-intent relevance
    if not has_cv:
        jobs_out = []
        for j in real_jobs[:20]:
            jobs_out.append({
                "role": j["title"],
                "company": j["company"],
                "location": j["location"],
                "salary": j.get("salary", ""),
                "url": j["url"],
                "tags": j.get("tags", []),
                "source": j["source"],
                "posted_date": j.get("posted_date", ""),
                "deadline": j.get("deadline", ""),
                "fit": None,
                "relevance": None,
                "reason": "Upload your CV on the Profile page to get personalized fit scoring.",
                "location_tier": j["location_tier"],
            })
        # Sort: location tier first (best match for query), then keep original order
        tier_order = {"exact": 0, "remote": 1, "other": 2}
        jobs_out.sort(key=lambda x: tier_order.get(x.get("location_tier", "other"), 2))
        return {"jobs": jobs_out}

    # 6. Build Gemini scoring prompt with real job data + CV
    # Limit to top 25 jobs to stay within token limits
    jobs_to_score = real_jobs[:25]
    jobs_text = ""
    for i, j in enumerate(jobs_to_score):
        jobs_text += f"\n\nJOB {i+1}:\n"
        jobs_text += f"  Title: {j['title']}\n"
        jobs_text += f"  Company: {j['company']}\n"
        jobs_text += f"  Location: {j['location']}\n"
        jobs_text += f"  Salary: {j.get('salary', 'Not specified')}\n"
        jobs_text += f"  Posted: {j.get('posted_date', 'Not specified')}\n"
        api_dl = j.get('deadline', '')
        jobs_text += f"  Application Deadline: {api_dl if api_dl else 'Not specified (estimate if possible)'}\n"
        jobs_text += f"  Tags: {', '.join(j.get('tags', [])[:10])}\n"
        jobs_text += f"  Description: {j['description'][:600]}\n"
        jobs_text += f"  URL: {j['url']}\n"

    # Build intent-aware instructions based on what the user actually asked
    intent_instructions = ""
    if location_keywords:
        loc_str = ", ".join(location_keywords)
        intent_instructions += f"""\nLOCATION INTENT:
The user specified location preference: "{loc_str}"
- Jobs IN or near "{loc_str}" should score higher on relevance.
- Remote jobs get moderate relevance (usable from anywhere).
- Jobs in unrelated locations (not remote) should score lower on relevance.
"""

    prompt = f"""You are CareerPilot's Job Hunter Agent — an intelligent query-to-job matching system with CV awareness.

You have the user's real CV and a list of REAL job listings from the web. Your task is to SCORE each job on TWO dimensions and provide structured information.

USER'S CV:
{cv_context}

USER'S SEARCH QUERY: "{query}"
{intent_instructions}
REAL JOB LISTINGS:
{jobs_text}

INSTRUCTIONS:
For EACH job, produce:

1. **relevance** (0-100): How well the job matches the USER'S FULL SEARCH INTENT.
   - Consider ALL aspects of the query: role/type, location, seniority, timing, keywords.
   - A job that perfectly matches what the user described = 95-100.
   - A job that matches some aspects but not others = 50-80.
   - A job that matches very little of the query = 10-30.

2. **fit** (0-100): How well the job matches the USER'S CV (skills, experience, education, projects).
   - Strong skill/experience alignment = 80-100.
   - Partial alignment = 40-70.
   - Poor alignment = 10-30.

3. **deadline**: Estimate the application deadline. If the job was posted recently and no deadline is listed, suggest "Apply within 30 days". If clearly old, say "Likely closed". Otherwise "Not specified".

4. **reason**: Explain WHY the job matches (or doesn't) the query AND the CV. Mention:
   - Query match: role, location, seniority alignment with what was asked.
   - CV match: specific skills, projects, or experience from the CV that align.
   - Be honest about gaps.

Return AT MOST 15 jobs, sorted by relevance descending (best query matches first).

Return ONLY a valid JSON array in this exact format:
[
  {{
    "index": 1,
    "relevance": 92,
    "fit": 78,
    "deadline": "Apply within 30 days",
    "reason": "Query match: ML internship in Dhaka — exact role and location. CV match: Your TensorFlow project and Python skills align well, though you lack formal internship experience."
  }}
]

Each object must have: "index" (1-based), "relevance" (0-100 int), "fit" (0-100 int), "deadline" (string), "reason" (string).
Return ONLY the JSON array, no markdown, no code fences, no extra text."""

    # 7. Call Gemini with JSON mode
    try:
        response = call_gemini(
            prompt,
            config={"response_mime_type": "application/json"}
        )
        raw = response.text.strip()
        # Strip markdown code fences if Gemini wraps it
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()
        scores = json.loads(raw)
        if isinstance(scores, dict) and "scores" in scores:
            scores = scores["scores"]
    except Exception as e:
        print(f"[HuntJobs] Gemini scoring error, returning unscored jobs: {e}")
        scores = []

    # 8. Merge scores back onto real job data
    score_map = {}
    for s in scores:
        idx = s.get("index", 0)
        score_map[idx] = {
            "relevance": s.get("relevance"),
            "fit": s.get("fit"),
            "deadline": s.get("deadline", ""),
            "reason": s.get("reason", ""),
        }

    jobs_out = []
    for i, j in enumerate(jobs_to_score):
        job_idx = i + 1
        sc = score_map.get(job_idx, {"relevance": None, "fit": None, "deadline": "", "reason": ""})

        # Compute composite score: relevance (query intent) weighted higher than fit (CV)
        rel = sc.get("relevance")
        fit = sc.get("fit")
        if rel is not None and fit is not None:
            composite = round(rel * 0.6 + fit * 0.4)
        elif rel is not None:
            composite = rel  # only relevance available
        elif fit is not None:
            composite = fit  # only fit available
        else:
            composite = None

        jobs_out.append({
            "role": j["title"],
            "company": j["company"],
            "location": j["location"],
            "salary": j.get("salary", ""),
            "url": j["url"],
            "tags": j.get("tags", []),
            "source": j["source"],
            "posted_date": j.get("posted_date", ""),
            "deadline": j.get("deadline", "") or sc["deadline"],  # prefer API deadline over Gemini estimate
            "fit": fit,
            "relevance": rel,
            "reason": sc["reason"],
            "location_tier": j["location_tier"],
            "composite": composite,
        })

    # 9. Sort by composite score descending (query intent + CV fit combined)
    jobs_out.sort(
        key=lambda x: -(x["composite"] if x["composite"] is not None else -1)
    )

    # 10. Since user has a CV, only return jobs that were actually scored by Gemini
    #     (unscored jobs = Gemini didn't assess them, so showing "Upload CV" is wrong)
    jobs_out = [j for j in jobs_out if j["composite"] is not None]

    return {"jobs": jobs_out}