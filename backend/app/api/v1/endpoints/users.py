"""
User Management API Endpoints (Power Admin only).
"""

from uuid import UUID
from fastapi import APIRouter, Request, Query, status

from app.api.deps import DBSession, CurrentAdminUser, CurrentUser
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserPaginatedResponse,
    PasswordResetRequest,
    ExtendExpiryRequest,
)
from app.services.user_service import UserService

router = APIRouter()


@router.get("", response_model=UserPaginatedResponse)
async def list_users(
    admin_user: CurrentAdminUser,
    db: DBSession,
    search: str | None = Query(default=None, description="Search by ID, Name, or Department"),
    role: str | None = Query(default=None, description="Filter by POWER_ADMIN or STANDARD_USER"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    """
    List all users in the team workspace with search and pagination (Admin only).
    """
    user_service = UserService(db)
    return await user_service.list_users(
        team_id=admin_user.team_id,
        search=search,
        role=role,
        is_active=is_active,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Create a new user in the team workspace (Admin only).
    """
    ip_address = request.client.host if request.client else None
    user_service = UserService(db)
    return await user_service.create_user(
        admin_user=admin_user,
        payload=payload,
        ip_address=ip_address,
    )


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Update an existing user's details or role (Admin only).
    """
    ip_address = request.client.host if request.client else None
    user_service = UserService(db)
    return await user_service.update_user(
        admin_user=admin_user,
        user_id=user_id,
        payload=payload,
        ip_address=ip_address,
    )


@router.post("/{user_id}/toggle-active", response_model=UserResponse)
async def toggle_user_active(
    user_id: UUID,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Activate or deactivate a user account (Admin only).
    """
    ip_address = request.client.host if request.client else None
    user_service = UserService(db)
    return await user_service.toggle_active_status(
        admin_user=admin_user,
        user_id=user_id,
        ip_address=ip_address,
    )


@router.post("/{user_id}/reset-password", response_model=UserResponse)
async def reset_user_password(
    user_id: UUID,
    payload: PasswordResetRequest,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Reset a user's password and set force-change flag (Admin only).
    """
    ip_address = request.client.host if request.client else None
    user_service = UserService(db)
    return await user_service.reset_user_password(
        admin_user=admin_user,
        user_id=user_id,
        new_temporary_password=payload.new_temporary_password,
        must_change_password=payload.must_change_password,
        ip_address=ip_address,
    )


@router.post("/{user_id}/extend-password-expiry", response_model=UserResponse)
async def extend_password_expiry(
    user_id: UUID,
    payload: ExtendExpiryRequest,
    admin_user: CurrentAdminUser,
    request: Request,
    db: DBSession,
):
    """
    Extend password validity period for a user by N days (Admin only).
    """
    ip_address = request.client.host if request.client else None
    user_service = UserService(db)
    return await user_service.extend_password_expiry(
        admin_user=admin_user,
        user_id=user_id,
        additional_days=payload.additional_days,
        ip_address=ip_address,
    )
