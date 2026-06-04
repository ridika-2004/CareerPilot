import chromadb
from openai import OpenAI
from django.conf import settings
api_key = settings.OPENAI_API_KEY or ""
if "GEMINI_API_KEY=" in api_key:
    api_key = api_key.split("GEMINI_API_KEY=")[1]

openai_client = OpenAI(
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Data saved in a local folder called "chroma_db" in your project root
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="cv_chunks",
    metadata={"hnsw:space": "cosine"}
)


def embed_and_store(chunks, user_id):
    # Delete old CV data for this user
    existing = collection.get(where={"user_id": user_id})
    if existing["ids"]:
        collection.delete(ids=existing["ids"])

    stored = []
    errors = []

    for i, chunk in enumerate(chunks):
        try:
            response = openai_client.embeddings.create(
                model="gemini-embedding-001",
                input=chunk["content"]
            )
            embedding = response.data[0].embedding

            collection.add(
                ids=[f"{user_id}_{i}"],
                embeddings=[embedding],
                documents=[chunk["content"]],
                metadatas=[{"user_id": user_id, "section": chunk["section"]}]
            )
            stored.append(chunk)
        except Exception as e:
            print(f"Error embedding chunk {i} ({chunk['section']}): {e}")
            errors.append(str(e))

    if not stored:
        raise ValueError(
            f"Failed to embed any chunks. Errors: {'; '.join(errors) if errors else 'Unknown error'}"
        )

    return stored


def query_cv(user_id, question, top_k=5):
    response = openai_client.embeddings.create(
        model="gemini-embedding-001",
        input=question
    )
    query_embedding = response.data[0].embedding

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id}
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        chunks.append({
            "content": doc,
            "section": results["metadatas"][0][i]["section"]
        })

    return chunks


def ask_with_rag(user_id, question):
    chunks = query_cv(user_id, question)

    if not chunks:
        return {
            "answer": "I couldn't find relevant information in your CV.",
            "source_sections": []
        }

    context = "\n\n---\n\n".join(
        f"[{c['section'].upper()}]\n{c['content']}" for c in chunks
    )

    completion = openai_client.chat.completions.create(
        model="gemini-2.5-flash",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": f"""You are CareerPilot, an AI career assistant.
You ONLY answer based on the user's actual CV information below.
Never fabricate experience not present in the CV.
If something isn't in the CV, say so honestly.

USER'S CV CONTEXT:
{context}"""
            },
            {
                "role": "user",
                "content": question
            }
        ]
    )

    return {
        "answer": completion.choices[0].message.content,
        "source_sections": [c["section"] for c in chunks]
    }