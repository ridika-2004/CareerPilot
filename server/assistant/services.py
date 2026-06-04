import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

SYSTEM_PROMPT = """
You are a career assistant AI.

You MUST follow these rules strictly:

1. Always ground answers in the user's CV context.
2. If user asks: "Am I ready for a data engineer role?"
   → Give verdict + reasoning + gaps + improvement plan.

3. If user asks: "What skills am I missing for a Google internship?"
   → Benchmark comparison + missing skills.

4. If user asks: "Build me a 3-month roadmap to become job-ready"
   → Structured weekly plan.

5. If user asks: "Draft a cover letter for this job posting"
   → Personalized cover letter using user's experience.

6. Be concise, structured, and professional.
7. Always respond in Markdown.
8. Do NOT use LaTeX or code blocks.
9. no upload or download links, only text-based responses.
"""

def generate_reply(messages):
    conversation_text = SYSTEM_PROMPT + "\n\nConversation:\n"

    for msg in messages:
        role = "User" if msg.role == "user" else "Assistant"
        conversation_text += f"{role}: {msg.content}\n"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=conversation_text
    )

    return response.text