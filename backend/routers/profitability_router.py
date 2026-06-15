import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore
from services.scenario_service import run_scenario_comparison

router = APIRouter(tags=["Profitability"])

@router.get("/profitability")
async def get_profitability(scenario: str = Query("Base")):
    """
    Returns profitability projections (revenue, COGS, estimated profit) per product.
    Enhanced: includes by_product breakdown + multi-scenario comparison.
    """
    try:
        comparison = run_scenario_comparison()
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profitability/raw")
async def get_profitability_raw(scenario: str = Query("Base")):
    """
    Returns raw per-product profitability for a single scenario (legacy format).
    """
    try:
        results = PipelineStore.get_results(scenario)
        return results["profitability"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
