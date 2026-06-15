import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard-summary")
async def get_dashboard_summary(scenario: str = Query("Base")):
    """
    Returns high-level summary KPIs (forecast totals, ROP alerts, profit estimates).
    """
    try:
        results = PipelineStore.get_results(scenario)
        return results["dashboard_summary"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
