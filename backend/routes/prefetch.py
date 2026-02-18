"""Prefetch route — /prefetch."""

from fastapi import APIRouter

from backend.models import PrefetchRequest
from backend.services.openfda import prefetch_fda_data

router = APIRouter()


@router.post("/prefetch")
async def prefetch_medications(request: PrefetchRequest):
    """Pre-fetch FDA data for selected medications so analysis is faster."""
    try:
        result = prefetch_fda_data(request.medications)
        return {
            "success": True,
            "message": f"Prefetched {result['new_fetches']} drugs, {result['cached']} from cache",
            "details": result,
        }
    except Exception as e:
        print(f"Prefetch error: {e}")
        return {"success": False, "error": "FDA verileri yüklenirken bir hata oluştu."}
