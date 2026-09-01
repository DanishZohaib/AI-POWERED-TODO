"""
Authentication API Endpoints.
Handles login, logout, password change, and current user profile retrieval.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Response, Request, status

from app.api.deps import DBSession, CurrentUser
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserAuthInfo,
    ChangePasswordRequest,
)
from app.services.auth_service import AuthService, ensure_tz_aware
from app.core.config import get_settings

settings = get_settings()
router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    response: Response,
    db: DBSession,
):
    """
    User login endpoint.
    Verifies User ID and Password.
    Sets HTTP-only cookie with JWT access token.
    """
    ip_address = request.client.host if request.client else None
    auth_service = AuthService(db)
    
    login_data, access_token = await auth_service.authenticate_user(
        credentials, ip_address=ip_address
    )

    # Set HTTP-only cookie for secure token storage
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False if settings.DEBUG else True,
    )

    return login_data


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    """
    User logout endpoint. Clears HTTP-only session cookie.
    """
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserAuthInfo)
async def get_me(current_user: CurrentUser):
    """
    Get current logged in user information.
    Includes password expiry details.
    """
    now = datetime.now(timezone.utc)
    expires_at = ensure_tz_aware(current_user.password_expires_at)
    diff_time = expires_at - now
    days_until_expiry = max(0, diff_time.days)

    return UserAuthInfo(
        id=current_user.id,
        user_code=current_user.user_code,
        full_name=current_user.full_name,
        department=current_user.department,
        designation=current_user.designation,
        role=current_user.role,
        team_id=current_user.team_id,
        is_active=current_user.is_active,
        password_expiry_days=current_user.password_expiry_days,
        password_expires_at=expires_at,
        must_change_password=current_user.must_change_password,
        days_until_expiry=days_until_expiry,
        last_login_at=current_user.last_login_at,
    )


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    request: Request,
    db: DBSession,
):
    """
    Change password endpoint.
    Verifies current password and validates new password strength.
    """
    ip_address = request.client.host if request.client else None
    auth_service = AuthService(db)

    await auth_service.change_password(
        current_user=current_user,
        payload=payload,
        ip_address=ip_address,
    )

    return {"message": "Password changed successfully."}
