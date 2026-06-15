import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore

router = APIRouter(tags=["MRP"])

@router.get("/mrp")
async def get_mrp(scenario: str = Query("Base")):
    """
    Returns the Material Requirements Planning (MRP) analysis for raw materials.
    """
    try:
        results = PipelineStore.get_results(scenario)
        return results["mrp"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
