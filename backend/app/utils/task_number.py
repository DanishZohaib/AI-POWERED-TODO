"""
Task number generation utility.
Generates human-readable task numbers: {CATEGORY_CODE}-{YEAR}-{SEQUENCE}
Example: NFS-2026-000001
"""

from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


async def generate_task_number(
    session: AsyncSession,
    category_code: str,
) -> str:
    """
    Generate the next task number for a category.
    Format: {CATEGORY_CODE}-{YEAR}-{NNNNNN}
    Thread-safe: uses database COUNT for sequence.
    """
    current_year = datetime.now(timezone.utc).year
    prefix = f"{category_code}-{current_year}-"

    # Count existing tasks with this prefix in current year
    result = await session.execute(
        select(func.count(Task.id)).where(
            Task.task_number.like(f"{prefix}%")
        )
    )
    count = result.scalar_one()
    next_number = count + 1

    return f"{prefix}{next_number:06d}"
