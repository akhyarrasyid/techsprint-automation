"""
Copilot Router — POST /copilot/ask
RAG-powered AI Supply Chain assistant endpoint.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rag.copilot_service import ask_copilot

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])


class CopilotRequest(BaseModel):
    question: str
    scenario: str = "Base"


class CopilotResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str
    latency_ms: float
    cached: bool = False


@router.post("/ask", response_model=CopilotResponse)
async def copilot_ask(req: CopilotRequest):
    """
    Ask the AI Supply Chain Copilot a question.
    Uses RAG (FAISS + Groq Llama 4 Scout) with live pipeline data.
    Falls back to rule-based insight engine if LLM is unavailable.
    """
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    try:
        result = ask_copilot(req.question, req.scenario)
        return CopilotResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
