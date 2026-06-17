"""Observability Router — GET /observability"""
from fastapi import APIRouter, HTTPException
from services.observability_service import get_observability_data

router = APIRouter(tags=["Observability"])

@router.get("/observability")
async def get_observability():
    """Returns system health, latency, memory, CPU, and service statuses."""
    try:
        return get_observability_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
