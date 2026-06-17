"""Anomaly Detection Router — GET /anomalies"""
from fastapi import APIRouter, Query, HTTPException
from services.anomaly_service import detect_anomalies

router = APIRouter(tags=["Anomaly Detection"])

@router.get("/anomalies")
async def get_anomalies(scenario: str = Query("Base")):
    """Returns detected anomalies in demand, stock, and supplier data."""
    try:
        return detect_anomalies(scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
