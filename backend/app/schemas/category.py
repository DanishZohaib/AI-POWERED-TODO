"""
Pydantic schemas for Category and Workflow Stage management.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class CategoryStageCreate(BaseModel):
    id: UUID | None = Field(default=None, description="Stage ID if updating existing stage")
    stage_name: str = Field(..., min_length=2, max_length=200, description="Stage name e.g. Clearance Received")
    stage_description: str | None = Field(default=None, max_length=500)
    stage_order: int = Field(..., ge=1, description="Stage sequence order (1-indexed)")
    is_required: bool = Field(default=True, description="Whether stage completion is mandatory")
    is_completion_stage: bool = Field(default=False, description="Special rule: completing this makes task 100% complete")
    is_active: bool = Field(default=True)


class CategoryStageResponse(BaseModel):
    id: UUID
    category_id: UUID
    stage_name: str
    stage_description: str | None = None
    stage_order: int
    is_required: bool
    is_completion_stage: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    category_code: str = Field(..., min_length=2, max_length=20, description="Category short code e.g. NFS")
    category_name: str = Field(..., min_length=3, max_length=200, description="Category name e.g. Normal Final Settlement")
    description: str | None = Field(default=None, max_length=1000)
    allow_stage_skipping: bool = Field(default=False, description="Allow completing stages out of order")
    is_active: bool = Field(default=True)
    stages: list[CategoryStageCreate] = Field(..., min_length=1, description="Workflow stages for this category")


class CategoryUpdate(BaseModel):
    category_name: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    allow_stage_skipping: bool | None = Field(default=None)
    is_active: bool | None = Field(default=None)


class StageReorderRequest(BaseModel):
    stages: list[CategoryStageCreate] = Field(..., min_length=1)


class CategoryResponse(BaseModel):
    id: UUID
    category_code: str
    category_name: str
    description: str | None = None
    allow_stage_skipping: bool
    is_active: bool
    team_id: UUID
    created_by: UUID
    creator_name: str | None = None
    stages: list[CategoryStageResponse]
    active_tasks_count: int = 0
    completed_tasks_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryListItem(BaseModel):
    id: UUID
    category_code: str
    category_name: str
    description: str | None = None
    allow_stage_skipping: bool
    is_active: bool
    stages_count: int
    active_tasks_count: int = 0
    completed_tasks_count: int = 0
    creator_name: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
