import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def generate_reply(messages):

    conversation = []

    for msg in messages:

        role = (
            "user"
            if msg.role == "user"
            else "model"
        )

        conversation.append({
            "role": role,
            "parts": [
                {
                    "text": msg.content
                }
            ]
        })

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=conversation
    )

    return response.text