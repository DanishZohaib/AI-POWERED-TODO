"""
Team model — supports multi-team architecture.
V1 uses a single default team; architecture ready for future multi-department expansion.
"""

from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin, TimestampMixin


class Team(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "teams"

    team_code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    team_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    users = relationship("User", back_populates="team", lazy="selectin")
    categories = relationship("Category", back_populates="team", lazy="selectin")
    tasks = relationship("Task", back_populates="team", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Team {self.team_code}: {self.team_name}>"
