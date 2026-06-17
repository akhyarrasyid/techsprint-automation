"""Model Monitoring Router — GET /model-monitoring"""
from fastapi import APIRouter, HTTPException
from services.model_monitoring_service import get_model_monitoring_data

router = APIRouter(tags=["Model Monitoring"])

@router.get("/model-monitoring")
async def get_model_monitoring():
    """Returns model monitoring metrics: drift, accuracy, SHAP analysis."""
    try:
        return get_model_monitoring_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
