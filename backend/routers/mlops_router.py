"""MLOps Router — GET /mlops"""
from fastapi import APIRouter, HTTPException
from services.mlops_service import get_mlops_data

router = APIRouter(tags=["MLOps"])

@router.get("/mlops")
async def get_mlops():
    """Returns MLOps dashboard: model registry, experiments, champion vs challenger."""
    try:
        return get_mlops_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
