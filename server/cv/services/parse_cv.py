import json
from .embed_store import openai_client

def parse_cv_structured(raw_text):
    """
    Uses gemini-2.5-flash with JSON mode to parse raw CV text into structured fields.
    """
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
  "title": "Current professional title, role or status (e.g. CS Student — BUET, Software Engineer)",
  "email": "Email Address",
  "skills": ["Skill 1", "Skill 2", ...],
  "experience": [
    {
      "role": "Job Role/Title",
      "company": "Company Name",
      "duration": "Duration (e.g. Jun–Sep 2024)",
      "bullets": ["Achievement 1", "Achievement 2", ...]
    }
  ],
  "education": [
    {
      "degree": "Degree (e.g. B.Sc. in CSE)",
      "institution": "Institution (e.g. BUET)",
      "year": "Year range (e.g. 2021–2025)"
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
        print("Error parsing CV structure with Gemini:", e)
        # Return empty structured fallback
        return {
            "name": "Candidate Name",
            "title": "Professional Title",
            "email": "",
            "skills": [],
            "experience": [],
            "education": [],
            "projects": []
        }
