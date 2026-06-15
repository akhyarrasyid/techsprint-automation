import os
import sys
from fastapi import APIRouter, Query, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore
from services.insight_engine import generate_insights

router = APIRouter(tags=["Insights"])

@router.get("/insights")
async def get_insights(scenario: str = Query("Base")):
    """
    Returns AI-generated structured insights from the full pipeline
    covering risk, warning, opportunity, and action items.
    """
    try:
        results = PipelineStore.get_results(scenario)
        insights = generate_insights(
            forecast=results.get("forecast", []),
            inventory=results.get("inventory", []),
            mrp=results.get("mrp", []),
            profitability=results.get("profitability", [])
        )
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
