from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.triage import TriageEngine
from typing import Optional

router = APIRouter()
engine = TriageEngine()


class TriageRequest(BaseModel):
    query: str
    history: Optional[str] = None


@router.post("/analyze")
async def analyze_triage(request: TriageRequest):
    try:
        result = await engine.analyze_symptoms(request.query, request.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
