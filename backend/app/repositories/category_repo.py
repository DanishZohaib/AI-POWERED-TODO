"""
Category Repository — Database operations for categories and workflow stages.
"""

from datetime import datetime, timezone
from uuid import UUID
from typing import Sequence

from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.category import Category, CategoryStage
from app.models.task import Task


class CategoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, category_id: UUID) -> Category | None:
        """Fetch category by ID with preloaded stages."""
        result = await self.db.execute(
            select(Category)
            .where(Category.id == category_id)
            .options(selectinload(Category.stages), selectinload(Category.creator))
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, team_id: UUID, category_code: str) -> Category | None:
        """Fetch category by code within a team."""
        result = await self.db.execute(
            select(Category)
            .where(Category.team_id == team_id, Category.category_code.ilike(category_code.strip()))
            .options(selectinload(Category.stages))
        )
        return result.scalar_one_or_none()

    async def list_categories(
        self,
        team_id: UUID,
        is_active_only: bool = False,
    ) -> Sequence[tuple[Category, int, int]]:
        """
        Fetch categories for team with count of active and completed tasks.
        Returns list of (Category, active_tasks_count, completed_tasks_count).
        """
        query = (
            select(Category)
            .where(Category.team_id == team_id)
            .options(selectinload(Category.stages), selectinload(Category.creator))
            .order_by(Category.category_name)
        )

        if is_active_only:
            query = query.where(Category.is_active == True)

        result = await self.db.execute(query)
        categories = result.scalars().all()

        output = []
        for cat in categories:
            # Active tasks count (NEW, IN_PROGRESS, PENDING, OVERDUE)
            active_count_res = await self.db.execute(
                select(func.count(Task.id)).where(
                    Task.category_id == cat.id,
                    Task.status.in_(["NEW", "IN_PROGRESS", "PENDING", "OVERDUE"])
                )
            )
            active_count = active_count_res.scalar_one()

            # Completed tasks count
            completed_count_res = await self.db.execute(
                select(func.count(Task.id)).where(
                    Task.category_id == cat.id,
                    Task.status == "COMPLETED"
                )
            )
            completed_count = completed_count_res.scalar_one()

            output.append((cat, active_count, completed_count))

        return output

    async def create_category(self, category: Category, stages: list[CategoryStage]) -> Category:
        """Create category and save its workflow stages."""
        self.db.add(category)
        await self.db.flush()

        for stage in stages:
            stage.category_id = category.id
            self.db.add(stage)

        await self.db.commit()
        return await self.get_by_id(category.id)

    async def update_category(self, category_id: UUID, **kwargs) -> Category | None:
        """Update category metadata fields."""
        kwargs["updated_at"] = datetime.now(timezone.utc)
        await self.db.execute(
            update(Category).where(Category.id == category_id).values(**kwargs)
        )
        await self.db.commit()
        return await self.get_by_id(category_id)

    async def replace_stages(
        self,
        category_id: UUID,
        new_stages: list[CategoryStage],
    ) -> Category | None:
        """Replace category workflow stages with a new ordered stage list."""
        # Delete existing stages for this category
        await self.db.execute(
            delete(CategoryStage).where(CategoryStage.category_id == category_id)
        )

        now = datetime.now(timezone.utc)
        for stage in new_stages:
            stage.category_id = category_id
            stage.created_at = now
            self.db.add(stage)

        await self.db.execute(
            update(Category).where(Category.id == category_id).values(updated_at=now)
        )
        await self.db.commit()

        return await self.get_by_id(category_id)
