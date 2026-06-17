"""KPI Router — GET /kpi"""
from fastapi import APIRouter, Query, HTTPException
from services.kpi_service import compute_kpis

router = APIRouter(tags=["KPI"])

@router.get("/kpi")
async def get_kpi(scenario: str = Query("Base")):
    """Returns real-time KPI metrics computed from pipeline data."""
    try:
        return compute_kpis(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
