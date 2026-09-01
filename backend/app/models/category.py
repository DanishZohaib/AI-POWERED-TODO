"""
Category and CategoryStage models.
Categories define workflow templates; stages are copied to tasks at creation time.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.models.base import Base, UUIDMixin, TimestampMixin


class Category(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "categories"

    category_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    category_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    allow_stage_skipping: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Team scope
    team_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False, index=True
    )

    # Created by admin
    created_by: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    team = relationship("Team", back_populates="categories", lazy="selectin")
    creator = relationship("User", back_populates="created_categories", lazy="selectin")
    stages = relationship(
        "CategoryStage",
        back_populates="category",
        lazy="selectin",
        order_by="CategoryStage.stage_order",
        cascade="all, delete-orphan",
    )
    tasks = relationship("Task", back_populates="category", lazy="selectin")

    __table_args__ = (
        Index("ix_categories_team_active", "team_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<Category {self.category_code}: {self.category_name}>"


class CategoryStage(Base, UUIDMixin):
    __tablename__ = "category_stages"

    category_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True
    )
    stage_name: Mapped[str] = mapped_column(String(200), nullable=False)
    stage_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    stage_order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_completion_stage: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Relationships
    category = relationship("Category", back_populates="stages")

    __table_args__ = (
        Index("ix_category_stages_order", "category_id", "stage_order"),
    )

    def __repr__(self) -> str:
        return f"<CategoryStage {self.stage_order}: {self.stage_name}>"
