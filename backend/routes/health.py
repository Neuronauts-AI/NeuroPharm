"""Health-check and root info routes."""

import httpx
from fastapi import APIRouter

from backend.config import FAL_KEY, OPENFDA_BASE_URL
from backend.logger import get_logger

router = APIRouter()


@router.get("/")
async def root():
    logger = get_logger()
    return {
        "service": "Drug Interaction Analysis API",
        "version": "6.0",
        "status": "running",
        "data_source": "OpenFDA API (Real-time)",
        "logging_enabled": logger.enabled,
    }


@router.get("/health")
async def health():
    logger = get_logger()
    openfda_status = "unknown"
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(OPENFDA_BASE_URL, params={"search": 'openfda.generic_name:"aspirin"', "limit": 1})
            if resp.status_code == 200:
                openfda_status = "healthy"
    except Exception:
        openfda_status = "offline"

    return {
        "status": "healthy" if openfda_status == "healthy" else "degraded",
        "fal_configured": FAL_KEY is not None,
        "openfda_status": openfda_status,
        "data_source": "OpenFDA API",
        "logging_enabled": logger.enabled,
    }
