"""
FastAPI dependencies — reusable dependency injections for routes.
Database sessions and authentication checks are injected here.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    TokenExpiredError,
    PermissionDeniedError,
    AdminRequiredError,
    InactiveUserError,
    PasswordExpiredError,
    MustChangePasswordError,
)
from app.repositories.user_repo import UserRepository
from app.models.user import User

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db)]


async def get_token_from_header_or_cookie(
    request: Request,
    access_token: str | None = Cookie(default=None),
) -> str:
    """Extract JWT token from Authorization header or HTTP-only cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    if access_token:
        return access_token
    raise TokenExpiredError()


async def get_current_user(
    db: DBSession,
    token: Annotated[str, Depends(get_token_from_header_or_cookie)],
) -> User:
    """
    Validate JWT token and return the current user from database.
    """
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise TokenExpiredError()

    try:
        user_id = UUID(payload["sub"])
    except ValueError:
        raise TokenExpiredError()

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise TokenExpiredError()

    if not user.is_active:
        raise InactiveUserError()

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Ensure current user is active and password has not expired.
    Allows accessing password change route even if password expired or must change password.
    """
    if current_user.must_change_password:
        raise MustChangePasswordError()
    return current_user


async def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Ensure current user is active and has Power Admin role.
    """
    if not current_user.is_admin:
        raise AdminRequiredError()
    return current_user


# Dependency Type Aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]
CurrentAdminUser = Annotated[User, Depends(get_current_admin_user)]
