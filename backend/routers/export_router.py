"""Export Router — GET /export/{format_type}"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response
from services.export_service import export_data

router = APIRouter(tags=["Export"])

@router.get("/export/{format_type}")
async def export_report(format_type: str, scenario: str = Query("Base")):
    """Export pipeline data as CSV, Excel, or JSON."""
    if format_type not in ("csv", "excel", "json"):
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format_type}")
    try:
        result = export_data(format_type, scenario)
        if "content_bytes" in result:
            return Response(content=result["content_bytes"], media_type=result["content_type"],
                          headers={"Content-Disposition": f"attachment; filename={result['filename']}"})
        return Response(content=result.get("content", ""), media_type=result["content_type"],
                       headers={"Content-Disposition": f"attachment; filename={result['filename']}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
