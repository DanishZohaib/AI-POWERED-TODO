"""
Test configuration and shared async SQLite database fixtures.
"""

import os
import asyncio
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from datetime import datetime, timezone
import uuid

from app.main import app
from app.models import (
    Base,
    Team,
    User,
    Category,
    CategoryStage,
    Task,
    TaskStage,
    TaskDelegation,
    AuditLog,
    Notification,
)
from app.db.database import get_db
from app.core.security import hash_password, calculate_password_expiry

TEST_DB_FILE = "./test_app.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    # Recreate clean tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        now = datetime.now(timezone.utc)
        team = Team(
            id=uuid.uuid4(),
            team_code="DEFAULT",
            team_name="Default Team",
            is_active=True,
        )
        session.add(team)
        await session.flush()

        admin = User(
            id=uuid.uuid4(),
            user_code="ADMIN001",
            full_name="System Admin",
            role="POWER_ADMIN",
            team_id=team.id,
            password_hash=hash_password("Admin@12345"),
            password_created_at=now,
            password_expiry_days=90,
            password_expires_at=calculate_password_expiry(90),
            must_change_password=False,
            is_active=True,
        )
        session.add(admin)

        user = User(
            id=uuid.uuid4(),
            user_code="USER001",
            full_name="Muhammad Ali",
            role="STANDARD_USER",
            team_id=team.id,
            password_hash=hash_password("User@12345"),
            password_created_at=now,
            password_expiry_days=30,
            password_expires_at=calculate_password_expiry(30),
            must_change_password=False,
            is_active=True,
        )
        session.add(user)
        await session.commit()

    yield

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    if os.path.exists(TEST_DB_FILE):
        try:
            os.remove(TEST_DB_FILE)
        except OSError:
            pass
