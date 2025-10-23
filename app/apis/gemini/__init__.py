import databutton as db
import google.generativeai as genai
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json

# Configure the Gemini API client
try:
    genai.configure(api_key=db.secrets.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-1.5-flash")
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

router = APIRouter(prefix="/gemini")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def generate_gemini_responses(messages: list[ChatMessage]):
    """
    A generator function that yields responses from the Gemini API.
    """
    if not model:
        yield "data: " + json.dumps({"error": "Gemini API not configured."}) + "\\n\\n"
        return

    # Convert messages to the format expected by the Gemini API
    history = [
        {"role": "user" if msg.role == "user" else "model", "parts": [msg.content]}
        for msg in messages
    ]

    # The last message is the new prompt
    new_prompt = history.pop()

    try:
        chat = model.start_chat(history=history)
        response = chat.send_message(new_prompt, stream=True)

        for chunk in response:
            if chunk.text:
                # Yield each chunk of the response as a server-sent event
                yield "data: " + json.dumps({"chunk": chunk.text}) + "\\n\\n"

    except Exception as e:
        print(f"Error communicating with Gemini API: {e}")
        yield "data: " + json.dumps({"error": f"An error occurred: {e}"}) + "\\n\\n"


@router.post("/chat", tags=["stream"])
def stream_chat(request: ChatRequest):
    """
    Endpoint to stream chat responses from the Gemini API.
    Uses Server-Sent Events (SSE) to stream data.
    """
    return StreamingResponse(
        generate_gemini_responses(request.messages),
        media_type="text/event-stream",
    )
