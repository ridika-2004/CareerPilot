import os
import json
import time
from google import genai
from google.genai import errors
from dotenv import load_dotenv
from cv.services.embed_store import query_cv, collection as cv_collection

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

# Models to try in order (each has its own free-tier quota)
FALLBACK_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash"]


def call_gemini(prompt, config=None, max_retries=2):
    """Call Gemini with automatic retry on 429 and model fallback."""
    models_to_try = ["gemini-2.5-flash"] + FALLBACK_MODELS

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
            except errors.ClientError as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
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
                    raise
    # All models exhausted
    raise Exception(
        "All Gemini models have exhausted their daily quota. "
        "The free tier allows 20 requests/day per model. "
        "Please wait for the quota to reset (resets daily) or upgrade to a paid plan."
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
    # 1. Retrieve CV context from ChromaDB (RAG)
    cv_chunks = query_cv(user_id, query, top_k=8)

    # Check if user has any CV data at all
    if not cv_chunks:
        # Also do a broader check — maybe the user just has no data
        all_data = cv_collection.get(where={"user_id": user_id})
        if not all_data["ids"]:
            raise ValueError("No CV found. Please upload your CV on the Profile page first.")
        # If data exists but query didn't match, use whatever is available
        cv_chunks = query_cv(user_id, "skills experience education projects", top_k=8)

    cv_context = "\n\n---\n\n".join(
        f"[{c['section'].upper()}]\n{c['content']}" for c in cv_chunks
    )

    # 2. Build the agent prompt
    prompt = f"""You are CareerPilot's Job Hunter Agent — an intelligent job-matching system.

You have access to the user's real CV data below. Your task is to find, filter, and score job opportunities that match their profile.

USER'S CV CONTEXT:
{cv_context}

USER'S SEARCH QUERY: "{query}"

INSTRUCTIONS:
1. Based on the user's CV (skills, experience, education, projects) and their search query, generate 5-8 realistic job opportunities.
2. Each job MUST be grounded in what the user actually has on their CV — do NOT fabricate experience or skills they don't have.
3. Include a mix: some high-fit jobs (user clearly qualifies), some medium-fit (close but gaps exist), and optionally one low-fit (aspirational/stretch).
4. Jobs should be realistic for the current market — use real-sounding company names, reasonable salary ranges.
5. Sort results by fit score descending.
6. For EACH job, explain in the 'reason' field WHY it matches or doesn't match the user's specific CV — reference concrete skills, projects, or experience from their CV.

Return ONLY a valid JSON object in this exact format:
{{
  "jobs": [
    {{
      "role": "Job Title",
      "company": "Company Name",
      "location": "City / Remote / Hybrid",
      "salary": "Salary range or 'Negotiable'",
      "deadline": "Application deadline (e.g. Jul 15, 2025) or 'Rolling'",
      "fit": 85,
      "reason": "Specific explanation referencing CV: e.g. 'Strong match — your Python, TensorFlow skills and ML project on X align directly. Location matches preference.'"
    }}
  ]
}}

IMPORTANT: Return ONLY the JSON object, no markdown, no code fences, no extra text."""

    # 3. Call Gemini with JSON mode (with retry + fallback)
    response = call_gemini(
        prompt,
        config={"response_mime_type": "application/json"}
    )

    # 4. Parse the response
    raw = response.text.strip()
    # Strip markdown code fences if Gemini wraps it
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    data = json.loads(raw)

    # Ensure we always return a list under "jobs"
    if isinstance(data, list):
        return {"jobs": data}
    return data