import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore

router = APIRouter(tags=["Inventory Planning"])

@router.get("/inventory")
async def get_inventory(scenario: str = Query("Base")):
    """
    Returns inventory planning statuses (Safety Stock, ROP, Recommended Orders) for all products.
    """
    try:
        results = PipelineStore.get_results(scenario)
        return results["inventory"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
