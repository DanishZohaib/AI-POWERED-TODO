"""
Pydantic schemas for Dashboard KPIs, charts, period filters, and team activity audit logs.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class CategoryStatItem(BaseModel):
    category_id: UUID
    category_code: str
    category_name: str
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float

    model_config = ConfigDict(from_attributes=True)


class StatusStatItem(BaseModel):
    status: str
    label: str
    count: int
    percentage: float


class PriorityStatItem(BaseModel):
    priority: str
    label: str
    count: int


class AuditActivityItem(BaseModel):
    id: UUID
    action_type: str
    entity_type: str
    entity_id: UUID | None = None
    user_name: str
    details: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardSummaryResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float
    status_distribution: list[StatusStatItem]
    category_statistics: list[CategoryStatItem]
    priority_distribution: list[PriorityStatItem]
    recent_activities: list[AuditActivityItem]

    model_config = ConfigDict(from_attributes=True)
