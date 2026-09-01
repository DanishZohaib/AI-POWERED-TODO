"""
Pydantic schemas for Task creation, updates, delegation, filtering, and responses.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class TaskStageResponse(BaseModel):
    id: UUID
    task_id: UUID
    stage_name: str
    stage_order: int
    is_required: bool
    is_completion_stage: bool
    is_completed: bool
    completed_by: UUID | None = None
    completer_name: str | None = None
    completed_at: datetime | None = None
    comments: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TaskDelegationResponse(BaseModel):
    id: UUID
    task_id: UUID
    delegated_by: UUID
    delegator_name: str | None = None
    previous_assignee: UUID | None = None
    previous_assignee_name: str | None = None
    delegated_to: UUID
    new_assignee_name: str | None = None
    delegated_at: datetime
    reason: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500, description="Task Title")
    description: str | None = Field(default=None, max_length=5000)
    category_id: UUID = Field(..., description="Workflow category ID")
    assigned_to: UUID | None = Field(default=None, description="Assignee user ID (defaults to creator if omitted)")
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    due_date: datetime | None = Field(default=None)
    notes: str | None = Field(default=None)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    priority: str | None = Field(default=None, description="LOW, MEDIUM, HIGH, CRITICAL")
    due_date: datetime | None = Field(default=None)
    notes: str | None = Field(default=None)
    status: str | None = Field(default=None, description="NEW, IN_PROGRESS, PENDING, COMPLETED, OVERDUE, CANCELLED")


class TaskDelegatePayload(BaseModel):
    delegated_to: UUID = Field(..., description="User ID of the new assignee")
    reason: str | None = Field(default=None, max_length=1000, description="Reason for task delegation")


class TaskResponse(BaseModel):
    id: UUID
    task_number: str
    title: str
    description: str | None = None
    category_id: UUID
    category_name: str | None = None
    category_code: str | None = None
    team_id: UUID
    created_by: UUID
    creator_name: str | None = None
    assigned_to: UUID
    assignee_name: str | None = None
    priority: str
    status: str
    progress_percentage: float
    due_date: datetime | None = None
    notes: str | None = None
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    stages: list[TaskStageResponse] = Field(default_factory=list)
    delegations: list[TaskDelegationResponse] = Field(default_factory=list)

    # Permission flags for frontend UI control
    can_edit: bool = False
    can_delegate: bool = False
    can_complete_stages: bool = False
    can_delete: bool = False

    model_config = ConfigDict(from_attributes=True)


class TaskListItem(BaseModel):
    id: UUID
    task_number: str
    title: str
    category_name: str | None = None
    category_code: str | None = None
    creator_name: str | None = None
    assignee_name: str | None = None
    priority: str
    status: str
    progress_percentage: float
    due_date: datetime | None = None
    current_stage: str | None = None
    total_stages: int = 0
    completed_stages: int = 0
    created_at: datetime

    can_edit: bool = False
    can_delegate: bool = False

    model_config = ConfigDict(from_attributes=True)


class TaskPaginatedResponse(BaseModel):
    items: list[TaskListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
