"""Data Quality Router — GET /data-quality"""
from fastapi import APIRouter, Query, HTTPException
from services.data_quality_service import assess_data_quality

router = APIRouter(tags=["Data Quality"])

@router.get("/data-quality")
async def get_data_quality(scenario: str = Query("Base")):
    """Returns comprehensive data quality assessment."""
    try:
        return assess_data_quality(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
