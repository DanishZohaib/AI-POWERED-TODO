"""
Task Management & Workflow Stage Execution API Endpoints.
Provides shared team workspace view, task creation, updates, delegation, and sequential stage processing.
"""

from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Request, Query, status

from app.api.deps import DBSession, CurrentUser
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskDelegatePayload,
    TaskResponse,
    TaskPaginatedResponse,
)
from app.schemas.workflow import StageCompletePayload
from app.services.task_service import TaskService

router = APIRouter()


@router.get("", response_model=TaskPaginatedResponse)
async def list_tasks(
    current_user: CurrentUser,
    db: DBSession,
    search: str | None = Query(default=None, description="Search by task number, title, or description"),
    status: str | None = Query(default=None, description="Filter by status NEW, IN_PROGRESS, PENDING, COMPLETED, OVERDUE, CANCELLED"),
    category_id: UUID | None = Query(default=None, description="Filter by workflow category ID"),
    assigned_to: UUID | None = Query(default=None, description="Filter by assigned user ID"),
    created_by: UUID | None = Query(default=None, description="Filter by creator user ID"),
    priority: str | None = Query(default=None, description="Filter by priority LOW, MEDIUM, HIGH, CRITICAL"),
    date_from: datetime | None = Query(default=None, description="Start date filter"),
    date_to: datetime | None = Query(default=None, description="End date filter"),
    overdue_only: bool = Query(default=False, description="Filter overdue tasks only"),
    view: str = Query(default="all", description="View scope: 'all' (default team view), 'my_tasks', 'created_by_me', 'assigned_to_me'"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """
    List tasks in the shared team workspace.
    Default view='all' returns all team tasks visible to all team users.
    """
    task_service = TaskService(db)
    return await task_service.list_tasks(
        current_user=current_user,
        search=search,
        status=status,
        category_id=category_id,
        assigned_to=assigned_to,
        created_by=created_by,
        priority=priority,
        date_from=date_from,
        date_to=date_to,
        overdue_only=overdue_only,
        view=view,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Get full details of a task including copied workflow stages and delegation history.
    """
    task_service = TaskService(db)
    return await task_service.get_task_detail(task_id, current_user)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Create a new task.
    Copies category workflow stages to task stages for historical immutability.
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    return await task_service.create_task(
        current_user=current_user,
        payload=payload,
        ip_address=ip_address,
    )


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Update task details (Creator, Assignee, or Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    return await task_service.update_task(
        current_user=current_user,
        task_id=task_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.post("/{task_id}/stages/{stage_id}/complete", response_model=TaskResponse)
async def complete_stage(
    task_id: UUID,
    stage_id: UUID,
    payload: StageCompletePayload,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Mark a workflow stage as completed sequentially.
    Auto-completes task if stage is a completion stage.
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    return await task_service.complete_stage(
        current_user=current_user,
        task_id=task_id,
        stage_id=stage_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.post("/{task_id}/stages/{stage_id}/uncomplete", response_model=TaskResponse)
async def uncomplete_stage(
    task_id: UUID,
    stage_id: UUID,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Mark a workflow stage as uncompleted.
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    return await task_service.uncomplete_stage(
        current_user=current_user,
        task_id=task_id,
        stage_id=stage_id,
        ip_address=ip_address,
    )


@router.post("/{task_id}/delegate", response_model=TaskResponse)
async def delegate_task(
    task_id: UUID,
    payload: TaskDelegatePayload,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Delegate task to another team member while preserving delegation history.
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    return await task_service.delegate_task(
        current_user=current_user,
        task_id=task_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: UUID,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Delete a task (Task Creator or Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    task_service = TaskService(db)
    await task_service.delete_task(
        current_user=current_user,
        task_id=task_id,
        ip_address=ip_address,
    )
    return {"message": "Task deleted successfully."}
