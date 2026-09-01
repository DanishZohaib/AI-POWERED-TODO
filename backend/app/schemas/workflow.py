"""
Pydantic schemas for workflow stage execution and progress processing.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class StageCompletePayload(BaseModel):
    comments: str | None = Field(default=None, max_length=2000, description="Optional stage completion remarks")


class StageExecutionResponse(BaseModel):
    task_id: UUID
    stage_id: UUID
    stage_name: str
    stage_order: int
    is_completed: bool
    completed_by: UUID | None = None
    completer_name: str | None = None
    completed_at: datetime | None = None
    comments: str | None = None
    task_status: str
    task_progress_percentage: float

    model_config = ConfigDict(from_attributes=True)
