import json
import re
import time
from .embed_store import openai_client


def _local_parse(raw_text):
    """
    Lightweight regex-based fallback when Gemini quota is exhausted.
    Extracts basic structure from raw CV text without any API calls.
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

    # Name: usually the first non-empty line
    name = lines[0] if lines else "Candidate Name"

    # Email
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', raw_text)
    email = email_match.group(0) if email_match else ""

    # Title: second line or line after name (heuristic)
    title = ""
    if len(lines) > 1:
        candidate = lines[1]
        if len(candidate) < 100 and '@' not in candidate and not re.match(r'^[\d+()-]+$', candidate):
            title = candidate

    # Skills: look for lines containing common skill keywords or comma-separated tokens
    skills = []
    skills_section = False
    for line in lines:
        low = line.lower()
        if re.match(r'^(technical\s+)?skills|technologies|competencies', low):
            skills_section = True
            # Check if skills are on the same line after a colon
            if ':' in line:
                parts = line.split(':', 1)[1]
                skills.extend([s.strip() for s in re.split(r'[,;|]', parts) if s.strip()])
            continue
        if skills_section:
            # End section on next header-like line
            if re.match(r'^(experience|education|projects|work|summary|objective)', low):
                skills_section = False
                continue
            tokens = re.split(r'[,;|]', line)
            skills.extend([t.strip() for t in tokens if t.strip() and len(t.strip()) < 40])

    # Deduplicate
    seen = set()
    unique_skills = []
    for s in skills:
        if s.lower() not in seen:
            seen.add(s.lower())
            unique_skills.append(s)
    skills = unique_skills[:30]

    # Experience: look for section and extract role/company/duration
    experience = []
    exp_section = False
    current = None
    for line in lines:
        low = line.lower()
        if re.match(r'^(work\s+)?experience|employment|professional', low):
            exp_section = True
            continue
        if exp_section:
            if re.match(r'^(education|projects|skills|summary|certifications)', low):
                if current:
                    experience.append(current)
                exp_section = False
                continue
            # Role line: short, title-cased
            if re.match(r'^(education|projects|skills|summary|certifications)', low):
                break
            dur_match = re.search(r'(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s]*[-–][\s]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s]*\d{0,4}|\b\d{4}[\s]*[-–][\s]*(?:\d{4}|[Pp]resent|[Cc]urrent)|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s]+\d{4}[\s]*[-–][\s]*(?:\d{4}|[Pp]resent|[Cc]urrent))', line)
            if dur_match and current is None:
                continue
            if not current or (len(line) < 80 and not line.startswith(('-', '•', '*'))):
                if current:
                    experience.append(current)
                current = {"role": line, "company": "", "duration": "", "bullets": []}
                if dur_match:
                    current["duration"] = dur_match.group(0).strip()
            elif line.startswith(('-', '•', '*')):
                if current:
                    current["bullets"].append(line.lstrip('-•* '))
            else:
                if current and not current["company"]:
                    current["company"] = line
    if current and exp_section:
        experience.append(current)

    # Education
    education = []
    edu_section = False
    for line in lines:
        low = line.lower()
        if re.match(r'^education|academic', low):
            edu_section = True
            continue
        if edu_section:
            if re.match(r'^(experience|projects|skills|summary|certifications|work)', low):
                edu_section = False
                continue
            year_match = re.search(r'\b(19|20)\d{2}\s*[-–]\s*((19|20)\d{2}|present)?', line, re.IGNORECASE)
            degree_keywords = ['b.sc', 'b.s.', 'bachelor', 'm.sc', 'm.s.', 'master', 'phd', 'diploma', 'b.a.', 'm.a.', 'bba', 'mba', 'b.eng', 'm.eng', 'hons']
            if any(kw in low for kw in degree_keywords):
                entry = {"degree": line, "institution": "", "year": year_match.group(0) if year_match else ""}
                education.append(entry)
            elif education and not education[-1]["institution"]:
                education[-1]["institution"] = line

    # Projects
    projects = []
    proj_section = False
    current_proj = None
    for line in lines:
        low = line.lower()
        if re.match(r'^projects|personal\s+projects', low):
            proj_section = True
            continue
        if proj_section:
            if re.match(r'^(experience|education|skills|summary|certifications|work)', low):
                if current_proj:
                    projects.append(current_proj)
                proj_section = False
                continue
            if not current_proj or (len(line) < 80 and not line.startswith(('-', '•', '*'))):
                if current_proj:
                    projects.append(current_proj)
                current_proj = {"name": line, "desc": ""}
            else:
                if current_proj and not current_proj["desc"]:
                    current_proj["desc"] = line
    if current_proj and proj_section:
        projects.append(current_proj)

    return {
        "name": name,
        "title": title,
        "email": email,
        "skills": skills,
        "experience": experience[:10],
        "education": education[:5],
        "projects": projects[:10],
    }


def parse_cv_structured(raw_text):
    """
    Uses gemini-2.5-flash with JSON mode to parse raw CV text into structured fields.
    Retries once on 429 rate-limit, then falls back to local regex parser.
    """
    max_retries = 1
    for attempt in range(max_retries + 1):
        try:
            response = openai_client.chat.completions.create(
                model="gemini-2.5-flash",
                response_format={"type": "json_object"},
                temperature=0.1,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert resume parsing assistant.
Analyze the resume text and extract the details in the following JSON format:
{
  "name": "Candidate's Full Name",
  "title": "Current professional title, role or status (e.g. CS Student, Software Engineer)",
  "email": "Email Address",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "role": "Job Role/Title",
      "company": "Company Name",
      "duration": "Duration (e.g. Jun-Sep 2024)",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g. B.Sc. in CSE)",
      "institution": "Institution (e.g. BUET)",
      "year": "Year range (e.g. 2021-2025)"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "desc": "Short description of the project and technologies used"
    }
  ]
}
Return ONLY a valid JSON object matching this schema. Make sure all lists are populated correctly from the CV."""
                    },
                    {
                        "role": "user",
                        "content": raw_text
                    }
                ]
            )
            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            err_str = str(e)
            # Retry once on rate limit (429)
            if "429" in err_str and attempt < max_retries:
                print(f"Rate limited (429). Retrying in 4 seconds...")
                time.sleep(4)
                continue

            print("Error parsing CV structure with Gemini:", e)
            print("Falling back to local regex parser.")
            result = _local_parse(raw_text)
            result["_parsed_locally"] = True
            return result
