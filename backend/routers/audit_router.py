"""Audit Trail Router — GET /audit-trail"""
from fastapi import APIRouter, Query, HTTPException
from services.audit_service import AuditTrail

router = APIRouter(tags=["Audit Trail"])

@router.get("/audit-trail")
async def get_audit_trail(limit: int = Query(50, ge=1, le=500)):
    """Returns recent audit trail entries."""
    try:
        entries = AuditTrail.get_recent(limit)
        stats = AuditTrail.get_stats()
        return {"entries": entries, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
