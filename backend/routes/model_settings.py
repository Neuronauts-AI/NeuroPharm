"""Runtime model settings routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.config import LLM_MODEL
from backend.runtime_model import get_runtime_model, set_runtime_model

router = APIRouter(prefix="/settings", tags=["settings"])


class ModelPreferenceRequest(BaseModel):
    llm_model: str = Field(..., min_length=1, max_length=200)


@router.get("/model")
async def get_model_preference():
    return {
        "llm_provider": "openrouter",
        "llm_model": get_runtime_model(LLM_MODEL),
    }


@router.post("/model")
async def set_model_preference(request: ModelPreferenceRequest):
    try:
        model = set_runtime_model(request.llm_model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "message": "Model tercihi kaydedildi",
        "llm_provider": "openrouter",
        "llm_model": model,
    }
