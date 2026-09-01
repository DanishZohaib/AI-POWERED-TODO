"""
Category Service — Business logic for category and workflow stage management.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.category_repo import CategoryRepository
from app.repositories.audit_repo import AuditRepository
from app.core.exceptions import DuplicateError, NotFoundError, AppException
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListItem,
    CategoryStageResponse,
    StageReorderRequest,
)
from app.services.auth_service import ensure_tz_aware
from app.models.category import Category, CategoryStage
from app.models.user import User


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.category_repo = CategoryRepository(db)
        self.audit_repo = AuditRepository(db)

    def _to_category_response(
        self,
        category: Category,
        active_count: int = 0,
        completed_count: int = 0,
    ) -> CategoryResponse:
        stages_res = [
            CategoryStageResponse(
                id=s.id,
                category_id=s.category_id,
                stage_name=s.stage_name,
                stage_description=s.stage_description,
                stage_order=s.stage_order,
                is_required=s.is_required,
                is_completion_stage=s.is_completion_stage,
                is_active=s.is_active,
                created_at=ensure_tz_aware(s.created_at),
            )
            for s in sorted(category.stages, key=lambda x: x.stage_order)
        ]

        creator_name = category.creator.full_name if category.creator else "Admin"

        return CategoryResponse(
            id=category.id,
            category_code=category.category_code,
            category_name=category.category_name,
            description=category.description,
            allow_stage_skipping=category.allow_stage_skipping,
            is_active=category.is_active,
            team_id=category.team_id,
            created_by=category.created_by,
            creator_name=creator_name,
            stages=stages_res,
            active_tasks_count=active_count,
            completed_tasks_count=completed_count,
            created_at=ensure_tz_aware(category.created_at),
            updated_at=ensure_tz_aware(category.updated_at),
        )

    async def list_categories(
        self,
        team_id: UUID,
        is_active_only: bool = False,
    ) -> list[CategoryListItem]:
        """List categories with stage count and active/completed task counts."""
        results = await self.category_repo.list_categories(team_id, is_active_only)

        output = []
        for cat, active_count, completed_count in results:
            creator_name = cat.creator.full_name if cat.creator else "Admin"
            output.append(
                CategoryListItem(
                    id=cat.id,
                    category_code=cat.category_code,
                    category_name=cat.category_name,
                    description=cat.description,
                    allow_stage_skipping=cat.allow_stage_skipping,
                    is_active=cat.is_active,
                    stages_count=len(cat.stages),
                    active_tasks_count=active_count,
                    completed_tasks_count=completed_count,
                    creator_name=creator_name,
                    created_at=ensure_tz_aware(cat.created_at),
                )
            )
        return output

    async def get_category_detail(self, category_id: UUID) -> CategoryResponse:
        """Get full category details with ordered stages."""
        cat = await self.category_repo.get_by_id(category_id)
        if not cat:
            raise NotFoundError("Category")
        return self._to_category_response(cat)

    async def create_category(
        self,
        admin_user: User,
        payload: CategoryCreate,
        ip_address: str | None = None,
    ) -> CategoryResponse:
        """Create a new category with initial workflow stages."""
        # Check duplicate category_code
        cat_code = payload.category_code.strip().upper()
        existing = await self.category_repo.get_by_code(admin_user.team_id, cat_code)
        if existing:
            raise DuplicateError(f"Category code '{cat_code}' already exists.")

        if not payload.stages or len(payload.stages) == 0:
            raise AppException(status_code=400, detail="A category must contain at least 1 workflow stage.")

        now = datetime.now(timezone.utc)

        new_cat = Category(
            id=uuid4(),
            category_code=cat_code,
            category_name=payload.category_name.strip(),
            description=payload.description.strip() if payload.description else None,
            allow_stage_skipping=payload.allow_stage_skipping,
            is_active=payload.is_active,
            team_id=admin_user.team_id,
            created_by=admin_user.id,
            created_at=now,
            updated_at=now,
        )

        stages_list = []
        for idx, s in enumerate(payload.stages, 1):
            stages_list.append(
                CategoryStage(
                    id=uuid4(),
                    stage_name=s.stage_name.strip(),
                    stage_description=s.stage_description.strip() if s.stage_description else None,
                    stage_order=idx,  # Force sequential 1-indexed order
                    is_required=s.is_required,
                    is_completion_stage=s.is_completion_stage,
                    is_active=s.is_active,
                    created_at=now,
                )
            )

        saved_cat = await self.category_repo.create_category(new_cat, stages_list)

        # Audit log
        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="CATEGORY_CREATED",
            entity_type="CATEGORY",
            entity_id=saved_cat.id,
            new_value={"code": saved_cat.category_code, "name": saved_cat.category_name, "stages_count": len(stages_list)},
            ip_address=ip_address,
        )

        return self._to_category_response(saved_cat)

    async def update_category(
        self,
        admin_user: User,
        category_id: UUID,
        payload: CategoryUpdate,
        ip_address: str | None = None,
    ) -> CategoryResponse:
        """Update category metadata."""
        cat = await self.category_repo.get_by_id(category_id)
        if not cat or cat.team_id != admin_user.team_id:
            raise NotFoundError("Category")

        update_dict = payload.model_dump(exclude_unset=True)
        if not update_dict:
            return self._to_category_response(cat)

        updated_cat = await self.category_repo.update_category(category_id, **update_dict)

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="CATEGORY_UPDATED",
            entity_type="CATEGORY",
            entity_id=category_id,
            new_value=update_dict,
            ip_address=ip_address,
        )

        return self._to_category_response(updated_cat)

    async def replace_stages(
        self,
        admin_user: User,
        category_id: UUID,
        payload: StageReorderRequest,
        ip_address: str | None = None,
    ) -> CategoryResponse:
        """Reorder or replace workflow stages for a category."""
        cat = await self.category_repo.get_by_id(category_id)
        if not cat or cat.team_id != admin_user.team_id:
            raise NotFoundError("Category")

        if not payload.stages or len(payload.stages) == 0:
            raise AppException(status_code=400, detail="A category must contain at least 1 workflow stage.")

        now = datetime.now(timezone.utc)
        new_stages = []
        for idx, s in enumerate(payload.stages, 1):
            new_stages.append(
                CategoryStage(
                    id=s.id or uuid4(),
                    stage_name=s.stage_name.strip(),
                    stage_description=s.stage_description.strip() if s.stage_description else None,
                    stage_order=idx,
                    is_required=s.is_required,
                    is_completion_stage=s.is_completion_stage,
                    is_active=s.is_active,
                    created_at=now,
                )
            )

        updated_cat = await self.category_repo.replace_stages(category_id, new_stages)

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="CATEGORY_STAGES_REORDERED",
            entity_type="CATEGORY",
            entity_id=category_id,
            new_value={"new_stages_count": len(new_stages)},
            ip_address=ip_address,
        )

        return self._to_category_response(updated_cat)

    async def duplicate_category(
        self,
        admin_user: User,
        category_id: UUID,
        ip_address: str | None = None,
    ) -> CategoryResponse:
        """Duplicate an existing category and its workflow stages."""
        cat = await self.category_repo.get_by_id(category_id)
        if not cat or cat.team_id != admin_user.team_id:
            raise NotFoundError("Category")

        now = datetime.now(timezone.utc)
        new_code = f"{cat.category_code}_COPY"[:20]
        
        # Ensure code uniqueness
        counter = 1
        while await self.category_repo.get_by_code(admin_user.team_id, new_code):
            new_code = f"{cat.category_code}_C{counter}"[:20]
            counter += 1

        new_cat = Category(
            id=uuid4(),
            category_code=new_code,
            category_name=f"{cat.category_name} (Copy)",
            description=cat.description,
            allow_stage_skipping=cat.allow_stage_skipping,
            is_active=True,
            team_id=admin_user.team_id,
            created_by=admin_user.id,
            created_at=now,
            updated_at=now,
        )

        copied_stages = [
            CategoryStage(
                id=uuid4(),
                stage_name=s.stage_name,
                stage_description=s.stage_description,
                stage_order=s.stage_order,
                is_required=s.is_required,
                is_completion_stage=s.is_completion_stage,
                is_active=True,
                created_at=now,
            )
            for s in sorted(cat.stages, key=lambda x: x.stage_order)
        ]

        duplicated_cat = await self.category_repo.create_category(new_cat, copied_stages)

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="CATEGORY_DUPLICATED",
            entity_type="CATEGORY",
            entity_id=duplicated_cat.id,
            new_value={"original_id": str(category_id), "new_code": duplicated_cat.category_code},
            ip_address=ip_address,
        )

        return self._to_category_response(duplicated_cat)
