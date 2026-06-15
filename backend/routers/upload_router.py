import os
import sys
import pandas as pd
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from services.pipeline_store import PipelineStore
from services.validation_service import validate_sales_data

router = APIRouter(tags=["Upload & Pipeline"])

class PipelineRequest(BaseModel):
    scenario: str = "Base"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a sales history CSV file, validates its structure, 
    and stores it in-memory for downstream planning calculations.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Hanya file CSV yang diperbolehkan.")
        
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Run validations (will raise ValueError if required columns are missing)
        report = validate_sales_data(df)
        
        # Cache the uploaded dataframe in store
        PipelineStore.set_uploaded_df(df)
        
        return report
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses file: {str(e)}")

@router.post("/run-pipeline")
async def run_pipeline(payload: Optional[PipelineRequest] = None, scenario: str = Query("Base")):
    """
    Runs the complete inventory, forecast, MRP, and profit calculations.
    Accepts scenario via request body or query parameter.
    """
    scen = "Base"
    if payload and payload.scenario:
        scen = payload.scenario
    elif scenario:
        scen = scenario
        
    try:
        # Triggers full pipeline calculations
        results = PipelineStore.get_results(scen)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menjalankan pipeline: {str(e)}")
