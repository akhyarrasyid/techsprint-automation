"""Command Center Router — GET /command-center"""
from fastapi import APIRouter, Query, HTTPException
from services.command_center_service import get_command_center_data

router = APIRouter(tags=["Command Center"])

@router.get("/command-center")
async def get_command_center(scenario: str = Query("Base")):
    """Returns executive command center aggregated intelligence."""
    try:
        return get_command_center_data(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
