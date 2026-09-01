"""
User Service — Core business logic for Admin User Management.
"""

from datetime import datetime, timezone, timedelta
from uuid import UUID
from math import ceil
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repo import UserRepository
from app.repositories.audit_repo import AuditRepository
from app.core.security import hash_password, validate_password_strength, calculate_password_expiry
from app.core.exceptions import DuplicateError, NotFoundError, PasswordValidationError, PermissionDeniedError
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserPaginatedResponse
from app.services.auth_service import ensure_tz_aware
from app.models.user import User


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.audit_repo = AuditRepository(db)

    def _to_user_response(self, user: User) -> UserResponse:
        now = datetime.now(timezone.utc)
        expires_at = ensure_tz_aware(user.password_expires_at)
        diff_time = expires_at - now
        days_until_expiry = max(0, diff_time.days)

        return UserResponse(
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
            days_until_expiry=days_until_expiry,
            must_change_password=user.must_change_password,
            last_login_at=user.last_login_at,
            created_at=ensure_tz_aware(user.created_at),
            updated_at=ensure_tz_aware(user.updated_at),
        )

    async def list_users(
        self,
        team_id: UUID,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> UserPaginatedResponse:
        """List users for a team workspace with search and pagination."""
        users, total = await self.user_repo.list_users(
            team_id=team_id,
            search=search,
            role=role,
            is_active=is_active,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, ceil(total / page_size)) if total > 0 else 1
        items = [self._to_user_response(u) for u in users]

        return UserPaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def create_user(
        self,
        admin_user: User,
        payload: UserCreate,
        ip_address: str | None = None,
    ) -> UserResponse:
        """Create a new user (Admin only)."""
        # Check duplicate user_code
        existing = await self.user_repo.get_by_user_code(payload.user_code)
        if existing:
            raise DuplicateError(f"User ID '{payload.user_code}' is already registered.")

        # Validate temporary password strength
        validation_errors = validate_password_strength(payload.temporary_password)
        if validation_errors:
            raise PasswordValidationError(validation_errors)

        now = datetime.now(timezone.utc)
        pwd_hash = hash_password(payload.temporary_password)
        expires_at = calculate_password_expiry(payload.password_expiry_days)

        new_user = User(
            user_code=payload.user_code.strip().upper(),
            full_name=payload.full_name.strip(),
            department=payload.department.strip() if payload.department else None,
            designation=payload.designation.strip() if payload.designation else None,
            role=payload.role,
            team_id=admin_user.team_id,
            password_hash=pwd_hash,
            password_created_at=now,
            password_expiry_days=payload.password_expiry_days,
            password_expires_at=expires_at,
            must_change_password=payload.must_change_password,
            is_active=payload.is_active,
            created_at=now,
            updated_at=now,
        )

        saved_user = await self.user_repo.create_user(new_user)

        # Audit log
        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="USER_CREATED",
            entity_type="USER",
            entity_id=saved_user.id,
            new_value={"user_code": saved_user.user_code, "role": saved_user.role},
            ip_address=ip_address,
        )

        return self._to_user_response(saved_user)

    async def update_user(
        self,
        admin_user: User,
        user_id: UUID,
        payload: UserUpdate,
        ip_address: str | None = None,
    ) -> UserResponse:
        """Update an existing user's details."""
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user or target_user.team_id != admin_user.team_id:
            raise NotFoundError("User")

        update_dict = payload.model_dump(exclude_unset=True)
        if not update_dict:
            return self._to_user_response(target_user)

        # If password_expiry_days is changed, update password_expires_at relative to password_created_at
        if "password_expiry_days" in update_dict:
            created_at_tz = ensure_tz_aware(target_user.password_created_at or target_user.created_at)
            update_dict["password_expires_at"] = created_at_tz + timedelta(days=update_dict["password_expiry_days"])

        updated_user = await self.user_repo.update_user(user_id, **update_dict)

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="USER_UPDATED",
            entity_type="USER",
            entity_id=user_id,
            new_value=update_dict,
            ip_address=ip_address,
        )

        return self._to_user_response(updated_user)

    async def toggle_active_status(
        self,
        admin_user: User,
        user_id: UUID,
        ip_address: str | None = None,
    ) -> UserResponse:
        """Activate or Deactivate a user."""
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user or target_user.team_id != admin_user.team_id:
            raise NotFoundError("User")

        # Prevent admin from deactivating themselves
        if target_user.id == admin_user.id:
            raise PermissionDeniedError("You cannot deactivate your own admin account.")

        new_status = not target_user.is_active
        updated_user = await self.user_repo.update_user(user_id, is_active=new_status)

        action_type = "USER_ACTIVATED" if new_status else "USER_DEACTIVATED"
        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type=action_type,
            entity_type="USER",
            entity_id=user_id,
            ip_address=ip_address,
        )

        return self._to_user_response(updated_user)

    async def reset_user_password(
        self,
        admin_user: User,
        user_id: UUID,
        new_temporary_password: str,
        must_change_password: bool = True,
        ip_address: str | None = None,
    ) -> UserResponse:
        """Reset a user's password (Admin function)."""
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user or target_user.team_id != admin_user.team_id:
            raise NotFoundError("User")

        validation_errors = validate_password_strength(new_temporary_password)
        if validation_errors:
            raise PasswordValidationError(validation_errors)

        pwd_hash = hash_password(new_temporary_password)
        expires_at = calculate_password_expiry(target_user.password_expiry_days)

        await self.user_repo.update_password(
            user_id=user_id,
            password_hash=pwd_hash,
            password_expires_at=expires_at,
            must_change_password=must_change_password,
        )

        updated_user = await self.user_repo.get_by_id(user_id)

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="PASSWORD_RESET",
            entity_type="USER",
            entity_id=user_id,
            ip_address=ip_address,
        )

        return self._to_user_response(updated_user)

    async def extend_password_expiry(
        self,
        admin_user: User,
        user_id: UUID,
        additional_days: int,
        ip_address: str | None = None,
    ) -> UserResponse:
        """Extend password validity period by N days."""
        target_user = await self.user_repo.get_by_id(user_id)
        if not target_user or target_user.team_id != admin_user.team_id:
            raise NotFoundError("User")

        current_expiry = ensure_tz_aware(target_user.password_expires_at)
        now = datetime.now(timezone.utc)
        base_time = max(now, current_expiry)
        new_expiry = base_time + timedelta(days=additional_days)

        updated_user = await self.user_repo.update_user(
            user_id,
            password_expires_at=new_expiry,
            password_expiry_days=target_user.password_expiry_days + additional_days,
        )

        await self.audit_repo.log_event(
            user_id=admin_user.id,
            team_id=admin_user.team_id,
            action_type="PASSWORD_EXPIRY_EXTENDED",
            entity_type="USER",
            entity_id=user_id,
            new_value={"additional_days": additional_days, "new_expiry": new_expiry.isoformat()},
            ip_address=ip_address,
        )

        return self._to_user_response(updated_user)
