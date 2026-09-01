"""
Dashboard Analytics Service — Shared team workspace KPIs, Recharts metrics, and team activity audit feed.
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Sequence
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task
from app.models.category import Category
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    CategoryStatItem,
    StatusStatItem,
    PriorityStatItem,
    AuditActivityItem,
)
from app.services.auth_service import ensure_tz_aware
from app.core.constants import TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_period_start(self, period: str) -> datetime | None:
        now = datetime.now(timezone.utc)
        if period == "7d":
            return now - timedelta(days=7)
        elif period == "30d":
            return now - timedelta(days=30)
        elif period == "90d":
            return now - timedelta(days=90)
        elif period == "1y":
            return now - timedelta(days=365)
        return None  # "all"

    async def get_summary(
        self,
        team_id: UUID,
        period: str = "all",
    ) -> DashboardSummaryResponse:
        """
        Calculate team workspace summary KPIs and chart metrics.
        Default includes all team tasks.
        """
        now = datetime.now(timezone.utc)
        period_start = self._get_period_start(period)

        # Base Task Query Filter
        task_filter = [Task.team_id == team_id]
        if period_start:
            task_filter.append(Task.created_at >= period_start)

        # 1. Total Tasks
        total_q = select(func.count(Task.id)).where(and_(*task_filter))
        total_tasks = (await self.db.execute(total_q)).scalar_one()

        # 2. Completed Tasks
        comp_q = select(func.count(Task.id)).where(and_(*task_filter, Task.status == "COMPLETED"))
        completed_tasks = (await self.db.execute(comp_q)).scalar_one()

        # 3. Pending Tasks (NEW, IN_PROGRESS, PENDING)
        pend_q = select(func.count(Task.id)).where(
            and_(*task_filter, Task.status.in_(["NEW", "IN_PROGRESS", "PENDING"]))
        )
        pending_tasks = (await self.db.execute(pend_q)).scalar_one()

        # 4. Overdue Tasks
        overdue_q = select(func.count(Task.id)).where(
            and_(
                *task_filter,
                Task.due_date.isnot(None),
                Task.due_date < now,
                Task.status != "COMPLETED",
                Task.status != "CANCELLED",
            )
        )
        overdue_tasks = (await self.db.execute(overdue_q)).scalar_one()

        completion_rate = round((completed_tasks / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0

        # 5. Status Distribution
        status_dist: list[StatusStatItem] = []
        for status_key, config in TASK_STATUS_CONFIG.items():
            st_q = select(func.count(Task.id)).where(and_(*task_filter, Task.status == status_key))
            count = (await self.db.execute(st_q)).scalar_one()
            pct = round((count / total_tasks * 100.0), 1) if total_tasks > 0 else 0.0
            status_dist.append(
                StatusStatItem(
                    status=status_key,
                    label=config["label"],
                    count=count,
                    percentage=pct,
                )
            )

        # 6. Priority Distribution
        priority_dist: list[PriorityStatItem] = []
        for priority_key, config in TASK_PRIORITY_CONFIG.items():
            pr_q = select(func.count(Task.id)).where(and_(*task_filter, Task.priority == priority_key))
            count = (await self.db.execute(pr_q)).scalar_one()
            priority_dist.append(
                PriorityStatItem(
                    priority=priority_key,
                    label=config["label"],
                    count=count,
                )
            )

        # 7. Category Statistics
        cat_q = select(Category).where(Category.team_id == team_id, Category.is_active == True)
        categories = (await self.db.execute(cat_q)).scalars().all()

        category_stats: list[CategoryStatItem] = []
        for cat in categories:
            cat_tot_q = select(func.count(Task.id)).where(and_(*task_filter, Task.category_id == cat.id))
            cat_tot = (await self.db.execute(cat_tot_q)).scalar_one()

            cat_comp_q = select(func.count(Task.id)).where(
                and_(*task_filter, Task.category_id == cat.id, Task.status == "COMPLETED")
            )
            cat_comp = (await self.db.execute(cat_comp_q)).scalar_one()

            cat_pend = cat_tot - cat_comp
            cat_rate = round((cat_comp / cat_tot * 100.0), 1) if cat_tot > 0 else 0.0

            category_stats.append(
                CategoryStatItem(
                    category_id=cat.id,
                    category_code=cat.category_code,
                    category_name=cat.category_name,
                    total_tasks=cat_tot,
                    completed_tasks=cat_comp,
                    pending_tasks=cat_pend,
                    completion_rate=cat_rate,
                )
            )

        # 8. Recent Team Activity Audit Feed (Latest 15 events)
        audit_q = (
            select(AuditLog)
            .where(AuditLog.team_id == team_id)
            .options(selectinload(AuditLog.user))
            .order_by(AuditLog.timestamp.desc())
            .limit(15)
        )
        audit_logs = (await self.db.execute(audit_q)).scalars().all()

        activities: list[AuditActivityItem] = []
        for a in audit_logs:
            user_name = a.user.full_name if a.user else "System"
            details = None
            if a.new_value:
                if isinstance(a.new_value, dict):
                    if "task_number" in a.new_value:
                        details = f"Task {a.new_value['task_number']}"
                    elif "stage_name" in a.new_value:
                        details = f"Stage '{a.new_value['stage_name']}'"
                    elif "full_name font-medium" in a.new_value:
                        details = f"User '{a.new_value.get('full_name')}'"

            activities.append(
                AuditActivityItem(
                    id=a.id,
                    action_type=a.action_type,
                    entity_type=a.entity_type or "SYSTEM",
                    entity_id=a.entity_id,
                    user_name=user_name,
                    details=details,
                    created_at=ensure_tz_aware(a.timestamp),
                )
            )

        return DashboardSummaryResponse(
            total_tasks=total_tasks,
            pending_tasks=pending_tasks,
            completed_tasks=completed_tasks,
            overdue_tasks=overdue_tasks,
            completion_rate=completion_rate,
            status_distribution=status_dist,
            category_statistics=category_stats,
            priority_distribution=priority_dist,
            recent_activities=activities,
        )
