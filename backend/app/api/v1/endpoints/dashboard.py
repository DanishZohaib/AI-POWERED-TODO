"""
Corporate Analytics Dashboard API Endpoint.
"""

from fastapi import APIRouter, Query, status

from app.api.deps import DBSession, CurrentUser
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: CurrentUser,
    db: DBSession,
    period: str = Query(default="all", description="Period filter: '7d', '30d', '90d', '1y', 'all'"),
):
    """
    Get corporate team workspace executive dashboard KPIs and chart metrics.
    Uses all team tasks by default.
    """
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_summary(
        team_id=current_user.team_id,
        period=period,
    )
