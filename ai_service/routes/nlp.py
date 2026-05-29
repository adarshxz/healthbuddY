from fastapi import APIRouter
from pydantic import BaseModel
from services.nlp import NLPService
from typing import Optional

router = APIRouter()
nlp_service = NLPService()


class TranslationRequest(BaseModel):
    text: str
    target_lang: Optional[str] = "en"


@router.post("/detect")
async def detect_language(request: TranslationRequest):
    result = nlp_service.detect_and_translate(request.text, request.target_lang)
    return result


@router.post("/translate")
async def translate(request: TranslationRequest):
    result = nlp_service.translate_to(request.text, request.target_lang)
    return {"translated_text": result}


@router.get("/languages")
async def get_languages():
    return nlp_service.get_supported_languages()
