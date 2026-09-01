"""
Task, TaskStage, and TaskDelegation models.
Core workflow entities — task_stages are copies of category_stages at creation time.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    String, Text, Boolean, Integer, Float,
    DateTime, ForeignKey, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class Task(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "tasks"

    # Human-readable task number: e.g. FS-2026-000001
    task_number: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Category reference
    category_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True
    )

    # Team scope
    team_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False, index=True
    )

    # Ownership
    created_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    assigned_to: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Task metadata
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="MEDIUM"
    )  # LOW, MEDIUM, HIGH, CRITICAL
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="NEW", index=True
    )  # NEW, IN_PROGRESS, PENDING, COMPLETED, OVERDUE, CANCELLED
    progress_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )

    # Dates
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    team = relationship("Team", back_populates="tasks", lazy="selectin")
    category = relationship("Category", back_populates="tasks", lazy="selectin")
    creator = relationship(
        "User", back_populates="created_tasks",
        foreign_keys=[created_by], lazy="selectin"
    )
    assignee = relationship(
        "User", back_populates="assigned_tasks",
        foreign_keys=[assigned_to], lazy="selectin"
    )
    stages = relationship(
        "TaskStage",
        back_populates="task",
        lazy="selectin",
        order_by="TaskStage.stage_order",
        cascade="all, delete-orphan",
    )
    delegations = relationship(
        "TaskDelegation",
        back_populates="task",
        lazy="selectin",
        order_by="TaskDelegation.delegated_at",
    )

    __table_args__ = (
        Index("ix_tasks_team_status", "team_id", "status"),
        Index("ix_tasks_team_created", "team_id", "created_at"),
        Index("ix_tasks_assigned_status", "assigned_to", "status"),
        Index("ix_tasks_created_by_created_at", "created_by", "created_at"),
        Index("ix_tasks_category_status", "category_id", "status"),
        Index("ix_tasks_due_date_status", "due_date", "status"),
    )

    def __repr__(self) -> str:
        return f"<Task {self.task_number}: {self.title}>"


class TaskStage(Base, UUIDMixin):
    """
    Snapshot of a workflow stage at task creation time.
    CRITICAL: These are COPIES from category_stages, not live references.
    Editing a category's stages does NOT affect existing task stages.
    """
    __tablename__ = "task_stages"

    task_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True
    )
    original_category_stage_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("category_stages.id"), nullable=True
    )

    # Copied stage data (frozen at task creation)
    stage_name: Mapped[str] = mapped_column(String(200), nullable=False)
    stage_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_completion_stage: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Completion tracking
    is_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    completed_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="stages")
    completer = relationship("User", foreign_keys=[completed_by], lazy="selectin")

    __table_args__ = (
        Index("ix_task_stages_task_order", "task_id", "stage_order"),
    )

    def __repr__(self) -> str:
        status = "✓" if self.is_completed else "○"
        return f"<TaskStage {status} {self.stage_order}: {self.stage_name}>"


class TaskDelegation(Base, UUIDMixin):
    """
    Complete delegation history. Never deleted.
    When a task is reassigned, a new delegation record is created.
    """
    __tablename__ = "task_delegations"

    task_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True
    )
    delegated_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    previous_assignee: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    delegated_to: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    delegated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    task = relationship("Task", back_populates="delegations")
    delegator = relationship("User", foreign_keys=[delegated_by], lazy="selectin")
    prev_assignee = relationship("User", foreign_keys=[previous_assignee], lazy="selectin")
    new_assignee = relationship("User", foreign_keys=[delegated_to], lazy="selectin")

    def __repr__(self) -> str:
        return f"<TaskDelegation task={self.task_id} to={self.delegated_to}>"
