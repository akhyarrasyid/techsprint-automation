import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore

router = APIRouter(tags=["Forecasting"])

@router.get("/forecast")
async def get_forecast(scenario: str = Query("Base")):
    """
    Returns the demand forecast (next 7 days) for each product.
    """
    try:
        results = PipelineStore.get_results(scenario)
        return results["forecast"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
