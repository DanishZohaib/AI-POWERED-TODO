"""
Task Service — Business logic for task tracking, delegation, permissions, and workflow stage processing.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4
from math import ceil
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.task_repo import TaskRepository
from app.repositories.category_repo import CategoryRepository
from app.repositories.user_repo import UserRepository
from app.repositories.audit_repo import AuditRepository
from app.core.exceptions import NotFoundError, PermissionDeniedError, AppException
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskDelegatePayload,
    TaskResponse,
    TaskListItem,
    TaskPaginatedResponse,
    TaskStageResponse,
    TaskDelegationResponse,
)
from app.schemas.workflow import StageCompletePayload
from app.services.auth_service import ensure_tz_aware
from app.models.task import Task
from app.models.user import User


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.category_repo = CategoryRepository(db)
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    def _calculate_permissions(self, task: Task, current_user: User) -> tuple[bool, bool, bool, bool]:
        """
        Calculate permission flags (can_edit, can_delegate, can_complete_stages, can_delete).
        """
        is_admin = current_user.is_admin
        is_creator = task.created_by == current_user.id
        is_assignee = task.assigned_to == current_user.id

        can_edit = is_admin or is_creator or is_assignee
        can_delegate = is_admin or is_creator or is_assignee
        can_complete_stages = is_admin or is_creator or is_assignee
        can_delete = is_admin or is_creator

        return can_edit, can_delegate, can_complete_stages, can_delete

    def _to_task_response(self, task: Task, current_user: User) -> TaskResponse:
        can_edit, can_delegate, can_complete_stages, can_delete = self._calculate_permissions(
            task, current_user
        )

        stages_res = [
            TaskStageResponse(
                id=s.id,
                task_id=s.task_id,
                stage_name=s.stage_name,
                stage_order=s.stage_order,
                is_required=s.is_required,
                is_completion_stage=s.is_completion_stage,
                is_completed=s.is_completed,
                completed_by=s.completed_by,
                completer_name=s.completer.full_name if s.completer else None,
                completed_at=ensure_tz_aware(s.completed_at) if s.completed_at else None,
                comments=s.comments,
            )
            for s in sorted(task.stages, key=lambda x: x.stage_order)
        ]

        delegations_res = [
            TaskDelegationResponse(
                id=d.id,
                task_id=d.task_id,
                delegated_by=d.delegated_by,
                delegator_name=d.delegator.full_name if d.delegator else "System",
                previous_assignee=d.previous_assignee,
                previous_assignee_name=d.prev_assignee.full_name if d.prev_assignee else None,
                delegated_to=d.delegated_to,
                new_assignee_name=d.new_assignee.full_name if d.new_assignee else "Unknown",
                delegated_at=ensure_tz_aware(d.delegated_at),
                reason=d.reason,
            )
            for d in sorted(task.delegations, key=lambda x: x.delegated_at)
        ]

        category_name = task.category.category_name if task.category else "Category"
        category_code = task.category.category_code if task.category else "CAT"
        creator_name = task.creator.full_name if task.creator else "User"
        assignee_name = task.assignee.full_name if task.assignee else "User"

        return TaskResponse(
            id=task.id,
            task_number=task.task_number,
            title=task.title,
            description=task.description,
            category_id=task.category_id,
            category_name=category_name,
            category_code=category_code,
            team_id=task.team_id,
            created_by=task.created_by,
            creator_name=creator_name,
            assigned_to=task.assigned_to,
            assignee_name=assignee_name,
            priority=task.priority,
            status=task.status,
            progress_percentage=task.progress_percentage,
            due_date=ensure_tz_aware(task.due_date) if task.due_date else None,
            notes=task.notes,
            completed_at=ensure_tz_aware(task.completed_at) if task.completed_at else None,
            created_at=ensure_tz_aware(task.created_at),
            updated_at=ensure_tz_aware(task.updated_at),
            stages=stages_res,
            delegations=delegations_res,
            can_edit=can_edit,
            can_delegate=can_delegate,
            can_complete_stages=can_complete_stages,
            can_delete=can_delete,
        )

    def _to_task_list_item(self, task: Task, current_user: User) -> TaskListItem:
        can_edit, can_delegate, _, _ = self._calculate_permissions(task, current_user)

        category_name = task.category.category_name if task.category else "Category"
        category_code = task.category.category_code if task.category else "CAT"
        creator_name = task.creator.full_name if task.creator else "User"
        assignee_name = task.assignee.full_name if task.assignee else "User"

        sorted_stages = sorted(task.stages, key=lambda x: x.stage_order)
        total_stages = len(sorted_stages)
        completed_stages = sum(1 for s in sorted_stages if s.is_completed)

        current_stage_name = "Completed" if task.status == "COMPLETED" else None
        if not current_stage_name:
            next_incomplete = next((s for s in sorted_stages if not s.is_completed), None)
            if next_incomplete:
                current_stage_name = next_incomplete.stage_name
            elif total_stages > 0:
                current_stage_name = sorted_stages[-1].stage_name

        return TaskListItem(
            id=task.id,
            task_number=task.task_number,
            title=task.title,
            category_name=category_name,
            category_code=category_code,
            creator_name=creator_name,
            assignee_name=assignee_name,
            priority=task.priority,
            status=task.status,
            progress_percentage=task.progress_percentage,
            due_date=ensure_tz_aware(task.due_date) if task.due_date else None,
            current_stage=current_stage_name,
            total_stages=total_stages,
            completed_stages=completed_stages,
            created_at=ensure_tz_aware(task.created_at),
            can_edit=can_edit,
            can_delegate=can_delegate,
        )

    async def list_tasks(
        self,
        current_user: User,
        search: str | None = None,
        status: str | None = None,
        category_id: UUID | None = None,
        assigned_to: UUID | None = None,
        created_by: UUID | None = None,
        priority: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        overdue_only: bool = False,
        view: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> TaskPaginatedResponse:
        """List team tasks with filtering, search, view options, and permission calculation."""
        tasks, total = await self.task_repo.list_tasks(
            team_id=current_user.team_id,
            current_user_id=current_user.id,
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
        total_pages = max(1, ceil(total / page_size)) if total > 0 else 1
        items = [self._to_task_list_item(t, current_user) for t in tasks]

        return TaskPaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_task_detail(self, task_id: UUID, current_user: User) -> TaskResponse:
        """Get full task details with stages and delegation history."""
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")
        return self._to_task_response(task, current_user)

    async def create_task(
        self,
        current_user: User,
        payload: TaskCreate,
        ip_address: str | None = None,
    ) -> TaskResponse:
        """Create a new task with copied category workflow stages."""
        category = await self.category_repo.get_by_id(payload.category_id)
        if not category or category.team_id != current_user.team_id:
            raise NotFoundError("Category")
        if not category.is_active:
            raise AppException(status_code=400, detail="Cannot create task in an inactive category.")

        assignee_id = payload.assigned_to or current_user.id
        assignee = await self.user_repo.get_by_id(assignee_id)
        if not assignee or assignee.team_id != current_user.team_id:
            raise NotFoundError("Assignee User")

        task_number = await self.task_repo.get_next_task_number(category.category_code)

        now = datetime.now(timezone.utc)
        new_task = Task(
            id=uuid4(),
            task_number=task_number,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            category_id=category.id,
            team_id=current_user.team_id,
            created_by=current_user.id,
            assigned_to=assignee_id,
            priority=payload.priority,
            status="NEW",
            progress_percentage=0.0,
            due_date=payload.due_date,
            notes=payload.notes.strip() if payload.notes else None,
            created_at=now,
            updated_at=now,
        )

        saved_task = await self.task_repo.create_task_with_stages(new_task, category.stages)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="TASK_CREATED",
            entity_type="TASK",
            entity_id=saved_task.id,
            new_value={"task_number": saved_task.task_number, "assigned_to": str(assignee_id)},
            ip_address=ip_address,
        )

        return self._to_task_response(saved_task, current_user)

    async def update_task(
        self,
        current_user: User,
        task_id: UUID,
        payload: TaskUpdate,
        ip_address: str | None = None,
    ) -> TaskResponse:
        """Update task details."""
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")

        can_edit, _, _, _ = self._calculate_permissions(task, current_user)
        if not can_edit:
            raise PermissionDeniedError("You do not have permission to modify this task.")

        update_dict = payload.model_dump(exclude_unset=True)
        if not update_dict:
            return self._to_task_response(task, current_user)

        await self.task_repo.update_task(task_id, **update_dict)
        updated_task = await self.task_repo.get_by_id(task_id)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="TASK_UPDATED",
            entity_type="TASK",
            entity_id=task_id,
            new_value=update_dict,
            ip_address=ip_address,
        )

        return self._to_task_response(updated_task, current_user)

    async def complete_stage(
        self,
        current_user: User,
        task_id: UUID,
        stage_id: UUID,
        payload: StageCompletePayload,
        ip_address: str | None = None,
    ) -> TaskResponse:
        """
        Mark stage completed sequentially and recalculate overall progress.
        """
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")

        _, _, can_complete_stages, _ = self._calculate_permissions(task, current_user)
        if not can_complete_stages:
            raise PermissionDeniedError("You do not have permission to process workflow stages for this task.")

        stage = await self.task_repo.get_stage_by_id(stage_id)
        if not stage or stage.task_id != task_id:
            raise NotFoundError("Task Stage")

        if stage.is_completed:
            return self._to_task_response(task, current_user)

        # Sequential Rule Verification: All prior required stages must be completed
        prior_incomplete_required = [
            s for s in task.stages
            if s.stage_order < stage.stage_order and s.is_required and not s.is_completed
        ]
        if prior_incomplete_required:
            blocking = prior_incomplete_required[0]
            raise AppException(
                status_code=400,
                detail=f"Cannot complete stage '{stage.stage_name}'. Prior required stage '{blocking.stage_name}' must be completed first.",
            )

        comments = payload.comments.strip() if payload.comments else None
        await self.task_repo.complete_stage(
            stage_id=stage.id,
            completed_by=current_user.id,
            comments=comments,
        )

        updated_task = await self.task_repo.recalculate_task_progress(task_id)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="STAGE_COMPLETED",
            entity_type="TASK_STAGE",
            entity_id=stage_id,
            new_value={
                "stage_name": stage.stage_name,
                "task_number": updated_task.task_number,
                "comments": comments,
                "is_completion_stage": stage.is_completion_stage,
            },
            ip_address=ip_address,
        )

        return self._to_task_response(updated_task, current_user)

    async def uncomplete_stage(
        self,
        current_user: User,
        task_id: UUID,
        stage_id: UUID,
        ip_address: str | None = None,
    ) -> TaskResponse:
        """
        Mark stage uncompleted and recalculate progress.
        """
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")

        _, _, can_complete_stages, _ = self._calculate_permissions(task, current_user)
        if not can_complete_stages:
            raise PermissionDeniedError("You do not have permission to process workflow stages for this task.")

        stage = await self.task_repo.get_stage_by_id(stage_id)
        if not stage or stage.task_id != task_id:
            raise NotFoundError("Task Stage")

        if not stage.is_completed:
            return self._to_task_response(task, current_user)

        await self.task_repo.uncomplete_stage(stage_id=stage.id)
        updated_task = await self.task_repo.recalculate_task_progress(task_id)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="STAGE_UNCOMPLETED",
            entity_type="TASK_STAGE",
            entity_id=stage_id,
            new_value={"stage_name": stage.stage_name, "task_number": updated_task.task_number},
            ip_address=ip_address,
        )

        return self._to_task_response(updated_task, current_user)

    async def delegate_task(
        self,
        current_user: User,
        task_id: UUID,
        payload: TaskDelegatePayload,
        ip_address: str | None = None,
    ) -> TaskResponse:
        """Delegate task to a new assignee while preserving delegation history."""
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")

        _, can_delegate, _, _ = self._calculate_permissions(task, current_user)
        if not can_delegate:
            raise PermissionDeniedError("You do not have permission to delegate this task.")

        target_user = await self.user_repo.get_by_id(payload.delegated_to)
        if not target_user or target_user.team_id != current_user.team_id:
            raise NotFoundError("Target Assignee User")
        if not target_user.is_active:
            raise AppException(status_code=400, detail="Cannot delegate task to an inactive user.")

        previous_assignee = task.assigned_to

        await self.task_repo.add_delegation(
            task_id=task.id,
            delegated_by=current_user.id,
            previous_assignee=previous_assignee,
            delegated_to=payload.delegated_to,
            reason=payload.reason.strip() if payload.reason else None,
        )

        updated_task = await self.task_repo.get_by_id(task_id)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="TASK_DELEGATED",
            entity_type="TASK",
            entity_id=task_id,
            new_value={"from": str(previous_assignee), "to": str(payload.delegated_to), "reason": payload.reason},
            ip_address=ip_address,
        )

        return self._to_task_response(updated_task, current_user)

    async def delete_task(
        self,
        current_user: User,
        task_id: UUID,
        ip_address: str | None = None,
    ) -> None:
        """Delete a task (Creator or Admin only)."""
        task = await self.task_repo.get_by_id(task_id)
        if not task or task.team_id != current_user.team_id:
            raise NotFoundError("Task")

        _, _, _, can_delete = self._calculate_permissions(task, current_user)
        if not can_delete:
            raise PermissionDeniedError("Only the task creator or Power Admin can delete this task.")

        await self.task_repo.delete_task(task_id)

        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="TASK_DELETED",
            entity_type="TASK",
            entity_id=task_id,
            ip_address=ip_address,
        )
