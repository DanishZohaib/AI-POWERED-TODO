"""
User model — supports Power Admin and Standard User roles.
Includes password expiry tracking, activation status, and team membership.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    # Identity
    user_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Role: POWER_ADMIN or STANDARD_USER
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="STANDARD_USER"
    )

    # Team membership
    team_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False, index=True
    )

    # Authentication
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    password_created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    password_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    password_expiry_days: Mapped[int] = mapped_column(
        Integer, default=30, nullable=False
    )
    password_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    team = relationship("Team", back_populates="users", lazy="selectin")
    created_tasks = relationship(
        "Task", back_populates="creator", foreign_keys="Task.created_by", lazy="selectin"
    )
    assigned_tasks = relationship(
        "Task", back_populates="assignee", foreign_keys="Task.assigned_to", lazy="selectin"
    )
    created_categories = relationship(
        "Category", back_populates="creator", lazy="selectin"
    )

    # Table indexes
    __table_args__ = (
        Index("ix_users_role", "role"),
        Index("ix_users_is_active", "is_active"),
        Index("ix_users_team_active", "team_id", "is_active"),
    )

    @property
    def is_admin(self) -> bool:
        """Check if user has Power Admin role."""
        return self.role == "POWER_ADMIN"

    def __repr__(self) -> str:
        return f"<User {self.user_code}: {self.full_name} ({self.role})>"
