"""
Category & Workflow Stage API Endpoints.
Reading categories is open to all team users (for task creation); modification requires Power Admin.
"""

from uuid import UUID
from fastapi import APIRouter, Request, Query, status

from app.api.deps import DBSession, CurrentUser, CurrentAdminUser
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListItem,
    StageReorderRequest,
)
from app.services.category_service import CategoryService

router = APIRouter()


@router.get("", response_model=list[CategoryListItem])
async def list_categories(
    current_user: CurrentUser,
    db: DBSession,
    is_active_only: bool = Query(default=False, description="Filter active categories only"),
):
    """
    List all categories with task count statistics for the team workspace.
    Accessible to all authenticated team members.
    """
    category_service = CategoryService(db)
    return await category_service.list_categories(
        team_id=current_user.team_id,
        is_active_only=is_active_only,
    )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    current_user: CurrentUser,
    db: DBSession,
):
    """
    Get full category details with ordered workflow stages.
    """
    category_service = CategoryService(db)
    return await category_service.get_category_detail(category_id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Create a new workflow category with custom stages (Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    category_service = CategoryService(db)
    return await category_service.create_category(
        admin_user=admin_user,
        payload=payload,
        ip_address=ip_address,
    )


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Update category metadata (Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    category_service = CategoryService(db)
    return await category_service.update_category(
        admin_user=admin_user,
        category_id=category_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.put("/{category_id}/stages", response_model=CategoryResponse)
async def replace_stages(
    category_id: UUID,
    payload: StageReorderRequest,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Reorder or replace workflow stages for a category (Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    category_service = CategoryService(db)
    return await category_service.replace_stages(
        admin_user=admin_user,
        category_id=category_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.post("/{category_id}/duplicate", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_category(
    category_id: UUID,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Duplicate an existing category and its workflow stages (Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    category_service = CategoryService(db)
    return await category_service.duplicate_category(
        admin_user=admin_user,
        category_id=category_id,
        ip_address=ip_address,
    )


@router.post("/{category_id}/toggle-active", response_model=CategoryResponse)
async def toggle_active(
    category_id: UUID,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Activate or deactivate a workflow category (Power Admin only).
    """
    ip_address = request.client.host if request.client else None
    category_service = CategoryService(db)
    cat = await category_service.get_category_detail(category_id)
    return await category_service.update_category(
        admin_user=admin_user,
        category_id=category_id,
        payload=CategoryUpdate(is_active=not cat.is_active),
        ip_address=ip_address,
    )
