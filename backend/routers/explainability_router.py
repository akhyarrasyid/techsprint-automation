import os
import sys
from fastapi import APIRouter, HTTPException

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.explainability_service import get_explainability_data

router = APIRouter(tags=["Explainability"])

@router.get("/explainability")
async def get_explainability():
    """
    Returns Explainable AI (XAI) datasets including LightGBM feature importance,
    SHAP summary values, and waterfall decision prediction step paths.
    """
    try:
        data = get_explainability_data()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
