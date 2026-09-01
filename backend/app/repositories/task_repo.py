"""
Task Repository — Shared team workspace queries, stage copying, delegation, and stage execution.
"""

from datetime import datetime, timezone
from uuid import UUID
from typing import Sequence

from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskStage, TaskDelegation
from app.models.category import Category, CategoryStage
from app.models.user import User


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: UUID) -> Task | None:
        """Fetch task by ID with preloaded relationships."""
        self.db.expire_all()
        result = await self.db.execute(
            select(Task)
            .where(Task.id == task_id)
            .options(
                selectinload(Task.category),
                selectinload(Task.creator),
                selectinload(Task.assignee),
                selectinload(Task.stages).selectinload(TaskStage.completer),
                selectinload(Task.delegations).selectinload(TaskDelegation.delegator),
                selectinload(Task.delegations).selectinload(TaskDelegation.prev_assignee),
                selectinload(Task.delegations).selectinload(TaskDelegation.new_assignee),
            )
        )
        return result.scalar_one_or_none()

    async def get_stage_by_id(self, stage_id: UUID) -> TaskStage | None:
        """Fetch specific task stage by ID."""
        result = await self.db.execute(
            select(TaskStage)
            .where(TaskStage.id == stage_id)
            .options(selectinload(TaskStage.completer))
        )
        return result.scalar_one_or_none()

    async def get_next_task_number(self, category_code: str) -> str:
        """Generate human-readable task number e.g. NFS-2026-000001."""
        year = datetime.now(timezone.utc).year
        prefix = f"{category_code.upper()}-{year}-"

        result = await self.db.execute(
            select(func.count(Task.id)).where(Task.task_number.like(f"{prefix}%"))
        )
        count = result.scalar_one() + 1
        return f"{prefix}{count:06d}"

    async def list_tasks(
        self,
        team_id: UUID,
        current_user_id: UUID,
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
    ) -> tuple[Sequence[Task], int]:
        """
        List tasks for team workspace with filters and pagination.
        Default view='all' returns ALL team tasks (shared workspace).
        """
        query = (
            select(Task)
            .where(Task.team_id == team_id)
            .options(
                selectinload(Task.category),
                selectinload(Task.creator),
                selectinload(Task.assignee),
                selectinload(Task.stages),
            )
        )

        # View Filters (built on top of shared team workspace data)
        if view == "my_tasks":
            query = query.where(
                or_(Task.assigned_to == current_user_id, Task.created_by == current_user_id)
            )
        elif view == "created_by_me":
            query = query.where(Task.created_by == current_user_id)
        elif view == "assigned_to_me":
            query = query.where(Task.assigned_to == current_user_id)

        # Explicit Filters
        if search:
            pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Task.task_number.ilike(pattern),
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                )
            )

        if status:
            query = query.where(Task.status == status)

        if category_id:
            query = query.where(Task.category_id == category_id)

        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)

        if created_by:
            query = query.where(Task.created_by == created_by)

        if priority:
            query = query.where(Task.priority == priority)

        if date_from:
            query = query.where(Task.created_at >= date_from)

        if date_to:
            query = query.where(Task.created_at <= date_to)

        now = datetime.now(timezone.utc)
        if overdue_only:
            query = query.where(
                Task.due_date.isnot(None),
                Task.due_date < now,
                Task.status != "COMPLETED",
                Task.status != "CANCELLED",
            )

        # Count total items
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Order by created_at descending
        offset = (page - 1) * page_size
        query = query.order_by(Task.created_at.desc()).offset(offset).limit(page_size)
        result = await self.db.execute(query)
        tasks = result.scalars().all()

        return tasks, total

    async def create_task_with_stages(
        self,
        task: Task,
        category_stages: Sequence[CategoryStage],
    ) -> Task:
        """
        Save new task and create frozen copies of category stages.
        """
        self.db.add(task)
        await self.db.flush()

        for stage in category_stages:
            task_stage = TaskStage(
                task_id=task.id,
                original_category_stage_id=stage.id,
                stage_name=stage.stage_name,
                stage_order=stage.stage_order,
                is_required=stage.is_required,
                is_completion_stage=stage.is_completion_stage,
                is_completed=False,
            )
            self.db.add(task_stage)

        await self.db.commit()
        return await self.get_by_id(task.id)

    async def update_task(self, task_id: UUID, **kwargs) -> Task | None:
        """Update task fields."""
        kwargs["updated_at"] = datetime.now(timezone.utc)
        await self.db.execute(
            update(Task).where(Task.id == task_id).values(**kwargs)
        )
        await self.db.commit()
        return await self.get_by_id(task_id)

    async def complete_stage(
        self,
        stage_id: UUID,
        completed_by: UUID,
        comments: str | None = None,
    ) -> TaskStage:
        """Mark task stage completed."""
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(TaskStage)
            .where(TaskStage.id == stage_id)
            .values(
                is_completed=True,
                completed_by=completed_by,
                completed_at=now,
                comments=comments,
            )
        )
        await self.db.commit()
        return await self.get_stage_by_id(stage_id)

    async def uncomplete_stage(self, stage_id: UUID) -> TaskStage:
        """Mark task stage uncompleted."""
        await self.db.execute(
            update(TaskStage)
            .where(TaskStage.id == stage_id)
            .values(
                is_completed=False,
                completed_by=None,
                completed_at=None,
                comments=None,
            )
        )
        await self.db.commit()
        return await self.get_stage_by_id(stage_id)

    async def recalculate_task_progress(self, task_id: UUID) -> Task:
        """
        Recalculate task progress percentage, status, and completion timestamp.
        """
        task = await self.get_by_id(task_id)
        if not task:
            raise ValueError("Task not found")

        stages = sorted(task.stages, key=lambda x: x.stage_order)
        total_stages = len(stages)
        completed_stages = sum(1 for s in stages if s.is_completed)

        progress_pct = (completed_stages / total_stages * 100.0) if total_stages > 0 else 0.0

        # Auto-complete rules:
        # 1. Any completed stage has is_completion_stage=True
        # 2. All stages are completed
        has_completion_stage_done = any(s.is_completed and s.is_completion_stage for s in stages)
        all_completed = total_stages > 0 and completed_stages == total_stages

        now = datetime.now(timezone.utc)
        new_status = task.status
        completed_at = task.completed_at

        if has_completion_stage_done or all_completed:
            new_status = "COMPLETED"
            progress_pct = 100.0
            if not completed_at:
                completed_at = now
        elif completed_stages > 0:
            if task.status == "NEW" or task.status == "COMPLETED":
                new_status = "IN_PROGRESS"
            completed_at = None
        else:
            if task.status == "COMPLETED":
                new_status = "IN_PROGRESS"
            completed_at = None

        await self.db.execute(
            update(Task)
            .where(Task.id == task_id)
            .values(
                progress_percentage=progress_pct,
                status=new_status,
                completed_at=completed_at,
                updated_at=now,
            )
        )
        await self.db.commit()
        return await self.get_by_id(task_id)

    async def add_delegation(
        self,
        task_id: UUID,
        delegated_by: UUID,
        previous_assignee: UUID | None,
        delegated_to: UUID,
        reason: str | None = None,
    ) -> TaskDelegation:
        """Record task delegation and update assignee."""
        now = datetime.now(timezone.utc)
        delegation = TaskDelegation(
            task_id=task_id,
            delegated_by=delegated_by,
            previous_assignee=previous_assignee,
            delegated_to=delegated_to,
            delegated_at=now,
            reason=reason,
        )
        self.db.add(delegation)

        await self.db.execute(
            update(Task)
            .where(Task.id == task_id)
            .values(assigned_to=delegated_to, updated_at=now)
        )

        await self.db.commit()
        return delegation

    async def delete_task(self, task_id: UUID) -> None:
        """Delete task and associated stages/delegations."""
        await self.db.execute(delete(Task).where(Task.id == task_id))
        await self.db.commit()
