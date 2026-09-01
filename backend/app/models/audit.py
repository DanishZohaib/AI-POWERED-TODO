"""
Audit log model — immutable record of all important system events.
Audit logs cannot be edited or deleted by any user.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, UUIDMixin


class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    team_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True, index=True
    )

    # What happened
    action_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    # Possible values:
    # LOGIN, LOGOUT, PASSWORD_CHANGE, PASSWORD_RESET,
    # USER_CREATED, USER_ACTIVATED, USER_DEACTIVATED,
    # CATEGORY_CREATED, CATEGORY_UPDATED,
    # TASK_CREATED, TASK_UPDATED, TASK_DELEGATED,
    # STAGE_COMPLETED, STAGE_REOPENED,
    # TASK_COMPLETED, TASK_CANCELLED

    # What was affected
    entity_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # USER, CATEGORY, TASK, TASK_STAGE

    entity_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True
    )

    # Change details (JSON-compatible text)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    user = relationship("User", lazy="selectin")
    team = relationship("Team", lazy="selectin")

    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
        Index("ix_audit_logs_team_time", "team_id", "timestamp"),
        Index("ix_audit_logs_user_time", "user_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog {self.action_type} by {self.user_id} at {self.timestamp}>"
