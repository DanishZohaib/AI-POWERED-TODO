"""
Corporate Reports & Multi-sheet Excel Export API Endpoints.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse

from app.api.deps import DBSession, CurrentUser
from app.services.excel_service import ExcelReportService

router = APIRouter()


@router.get("/export/excel")
async def export_excel_report(
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Download complete corporate team workspace report in Excel format (.xlsx).
    Contains Executive Summary, All Team Tasks, Category Statistics, and Audit Logs.
    """
    excel_service = ExcelReportService(db)
    buffer = await excel_service.generate_team_report(team_id=current_user.team_id)

    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"Corporate_Workflow_Report_{timestamp_str}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
