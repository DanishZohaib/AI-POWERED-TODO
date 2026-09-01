"""
User Repository — Encapsulates database operations for users.
"""

from datetime import datetime, timezone
from uuid import UUID
from typing import Sequence

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        """Fetch user by primary key ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_code(self, user_code: str) -> User | None:
        """Fetch user by unique user code / ID (case-insensitive search)."""
        result = await self.db.execute(
            select(User).where(User.user_code.ilike(user_code.strip()))
        )
        return result.scalar_one_or_none()

    async def get_all_active_by_team(self, team_id: UUID) -> Sequence[User]:
        """Fetch all active users in a team workspace."""
        result = await self.db.execute(
            select(User)
            .where(User.team_id == team_id, User.is_active == True)
            .order_by(User.full_name)
        )
        return result.scalars().all()

    async def list_users(
        self,
        team_id: UUID,
        search: str | None = None,
        role: str | None = None,
        is_active: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[Sequence[User], int]:
        """
        List users for a team workspace with optional filters and pagination.
        Returns (users, total_count).
        """
        query = select(User).where(User.team_id == team_id)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                (User.user_code.ilike(search_pattern))
                | (User.full_name.ilike(search_pattern))
                | (User.department.ilike(search_pattern))
            )

        if role:
            query = query.where(User.role == role)

        if is_active is not None:
            query = query.where(User.is_active == is_active)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Paginate
        offset = (page - 1) * page_size
        query = query.order_by(User.user_code).offset(offset).limit(page_size)
        result = await self.db.execute(query)
        users = result.scalars().all()

        return users, total

    async def create_user(self, user: User) -> User:
        """Save a new user record."""
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user(self, user_id: UUID, **kwargs) -> User | None:
        """Update fields on a user record."""
        kwargs["updated_at"] = datetime.now(timezone.utc)
        await self.db.execute(
            update(User).where(User.id == user_id).values(**kwargs)
        )
        await self.db.commit()
        return await self.get_by_id(user_id)

    async def update_last_login(self, user_id: UUID) -> None:
        """Update last_login_at timestamp."""
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def update_password(
        self,
        user_id: UUID,
        password_hash: str,
        password_expires_at: datetime,
        must_change_password: bool = False,
    ) -> None:
        """Update user password and reset expiry timestamps."""
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_hash=password_hash,
                password_changed_at=now,
                password_expires_at=password_expires_at,
                must_change_password=must_change_password,
                updated_at=now,
            )
        )
        await self.db.commit()
