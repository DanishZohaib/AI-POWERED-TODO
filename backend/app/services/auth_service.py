"""
Auth Service — Core business logic for authentication, password expiry, and password changes.
"""

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository
from app.repositories.audit_repo import AuditRepository
from app.core.security import (
    verify_password,
    hash_password,
    create_access_token,
    validate_password_strength,
    calculate_password_expiry,
)
from app.core.exceptions import (
    InvalidCredentialsError,
    InactiveUserError,
    PasswordValidationError,
)
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserAuthInfo,
    ChangePasswordRequest,
)
from app.models.user import User


def ensure_tz_aware(dt: datetime) -> datetime:
    """Ensure datetime object is UTC timezone aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    async def authenticate_user(
        self,
        credentials: LoginRequest,
        ip_address: str | None = None,
    ) -> tuple[LoginResponse, str]:
        """
        Authenticate user by User ID (user_code) and Password.
        Checks active status and password expiry.
        Returns (LoginResponse, jwt_token).
        """
        user = await self.user_repo.get_by_user_code(credentials.user_code)

        if not user:
            raise InvalidCredentialsError()

        if not verify_password(credentials.password, user.password_hash):
            raise InvalidCredentialsError()

        if not user.is_active:
            raise InactiveUserError()

        now = datetime.now(timezone.utc)
        expires_at = ensure_tz_aware(user.password_expires_at)
        
        # Calculate password expiry status
        password_expired = expires_at <= now
        diff_time = expires_at - now
        days_until_expiry = max(0, diff_time.days)

        # Update last login timestamp
        await self.user_repo.update_last_login(user.id)

        # Log login audit event
        await self.audit_repo.log_event(
            user_id=user.id,
            team_id=user.team_id,
            action_type="LOGIN",
            entity_type="USER",
            entity_id=user.id,
            ip_address=ip_address,
        )

        # Generate JWT access token
        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "user_code": user.user_code,
                "role": user.role,
                "team_id": str(user.team_id),
            }
        )

        user_info = UserAuthInfo(
            id=user.id,
            user_code=user.user_code,
            full_name=user.full_name,
            department=user.department,
            designation=user.designation,
            role=user.role,
            team_id=user.team_id,
            is_active=user.is_active,
            password_expiry_days=user.password_expiry_days,
            password_expires_at=expires_at,
            must_change_password=user.must_change_password,
            days_until_expiry=days_until_expiry,
            last_login_at=user.last_login_at,
        )

        message = "Login successful"
        if password_expired:
            message = "Your password has expired. Please change your password."
        elif user.must_change_password:
            message = "First login: Please change your temporary password."

        response = LoginResponse(
            user=user_info,
            access_token=access_token,
            password_expired=password_expired,
            must_change_password=user.must_change_password,
            days_until_expiry=days_until_expiry,
            message=message,
        )

        return response, access_token

    async def change_password(
        self,
        current_user: User,
        payload: ChangePasswordRequest,
        ip_address: str | None = None,
    ) -> None:
        """
        Change user password with strength validation and current password verification.
        """
        if not verify_password(payload.current_password, current_user.password_hash):
            raise InvalidCredentialsError()

        if payload.new_password != payload.confirm_password:
            raise PasswordValidationError(["New password and confirm password do not match."])

        # Validate password strength
        validation_errors = validate_password_strength(payload.new_password)
        if validation_errors:
            raise PasswordValidationError(validation_errors)

        # Hash new password and calculate new expiry date based on user's password_expiry_days
        new_hash = hash_password(payload.new_password)
        new_expiry = calculate_password_expiry(current_user.password_expiry_days)

        await self.user_repo.update_password(
            user_id=current_user.id,
            password_hash=new_hash,
            password_expires_at=new_expiry,
            must_change_password=False,
        )

        # Audit event
        await self.audit_repo.log_event(
            user_id=current_user.id,
            team_id=current_user.team_id,
            action_type="PASSWORD_CHANGE",
            entity_type="USER",
            entity_id=current_user.id,
            ip_address=ip_address,
        )
