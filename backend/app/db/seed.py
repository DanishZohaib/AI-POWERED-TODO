"""
Seed data script — creates default team, admin user, sample users, and example categories.
Run with: python -m app.db.seed
"""

import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import AsyncSessionLocal, engine
from app.models import Base, Team, User, Category, CategoryStage
from app.core.security import hash_password, calculate_password_expiry
from app.core.config import get_settings

settings = get_settings()


async def seed_database():
    """Create all tables and insert seed data."""
    # Create tables (for development — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if seed data already exists
        existing_team = await session.execute(
            select(Team).where(Team.team_code == "DEFAULT")
        )
        if existing_team.scalar_one_or_none():
            print("[INFO] Seed data already exists. Skipping.")
            return

        print("[INFO] Seeding database...")

        # ─── 1. Create Default Team ───
        default_team = Team(
            id=uuid.uuid4(),
            team_code="DEFAULT",
            team_name="Default Team",
            description="Default team workspace for all users",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        session.add(default_team)
        await session.flush()
        print(f"  [+] Team created: {default_team.team_name}")

        # ─── 2. Create Power Admin ───
        now = datetime.now(timezone.utc)
        admin_password_hash = hash_password(settings.SEED_ADMIN_PASSWORD)
        admin_expiry = calculate_password_expiry(settings.DEFAULT_PASSWORD_EXPIRY_DAYS)

        admin_user = User(
            id=uuid.uuid4(),
            user_code="ADMIN001",
            full_name="System Administrator",
            department="IT Administration",
            designation="Power Admin",
            role="POWER_ADMIN",
            team_id=default_team.id,
            password_hash=admin_password_hash,
            password_created_at=now,
            password_changed_at=None,
            password_expiry_days=90,
            password_expires_at=calculate_password_expiry(90),
            must_change_password=False,
            is_active=True,
            last_login_at=None,
            created_at=now,
            updated_at=now,
        )
        session.add(admin_user)
        await session.flush()
        print(f"  [+] Admin created: {admin_user.user_code} ({admin_user.full_name})")

        # ─── 3. Create Sample Standard Users ───
        sample_users_data = [
            {
                "user_code": "USER001",
                "full_name": "Muhammad Ali",
                "department": "Finance",
                "designation": "Senior Accountant",
            },
            {
                "user_code": "USER002",
                "full_name": "Fatima Khan",
                "department": "Finance",
                "designation": "Accounts Officer",
            },
            {
                "user_code": "USER003",
                "full_name": "Ahmed Hassan",
                "department": "Finance",
                "designation": "Finance Manager",
            },
            {
                "user_code": "USER004",
                "full_name": "Sara Malik",
                "department": "HR",
                "designation": "HR Executive",
            },
            {
                "user_code": "USER005",
                "full_name": "Omar Siddiqui",
                "department": "Legal",
                "designation": "Legal Officer",
            },
        ]

        sample_users = []
        for user_data in sample_users_data:
            user = User(
                id=uuid.uuid4(),
                user_code=user_data["user_code"],
                full_name=user_data["full_name"],
                department=user_data["department"],
                designation=user_data["designation"],
                role="STANDARD_USER",
                team_id=default_team.id,
                password_hash=hash_password("User@12345"),
                password_created_at=now,
                password_changed_at=None,
                password_expiry_days=settings.DEFAULT_PASSWORD_EXPIRY_DAYS,
                password_expires_at=admin_expiry,
                must_change_password=True,
                is_active=True,
                last_login_at=None,
                created_at=now,
                updated_at=now,
            )
            session.add(user)
            sample_users.append(user)

        await session.flush()
        for u in sample_users:
            print(f"  [+] User created: {u.user_code} ({u.full_name})")

        # ─── 4. Create Category: Normal Final Settlement ───
        cat_normal_fs = Category(
            id=uuid.uuid4(),
            category_code="NFS",
            category_name="Normal Final Settlement",
            description="Standard final settlement process for departing employees",
            allow_stage_skipping=False,
            is_active=True,
            team_id=default_team.id,
            created_by=admin_user.id,
            created_at=now,
            updated_at=now,
        )
        session.add(cat_normal_fs)
        await session.flush()

        nfs_stages = [
            ("F.S Internal Communication Received", False),
            ("Clearance Received", False),
            ("Vehicle Settlement", False),
            ("Drafted", False),
            ("Reviewed", False),
            ("Manager Reviewed", False),
            ("N.M Reviewed", False),
            ("CFO Approved", False),
            ("Cheque Received", True),  # <- Completion stage
        ]
        for order, (name, is_completion) in enumerate(nfs_stages, 1):
            stage = CategoryStage(
                id=uuid.uuid4(),
                category_id=cat_normal_fs.id,
                stage_name=name,
                stage_description=None,
                stage_order=order,
                is_required=True,
                is_completion_stage=is_completion,
                is_active=True,
                created_at=now,
            )
            session.add(stage)

        print(f"  [+] Category created: {cat_normal_fs.category_name} ({len(nfs_stages)} stages)")

        # ─── 5. Create Category: Deceased Employee Final Settlement ───
        cat_deceased_fs = Category(
            id=uuid.uuid4(),
            category_code="DFS",
            category_name="Deceased Employee Final Settlement",
            description="Final settlement process for deceased employee cases",
            allow_stage_skipping=False,
            is_active=True,
            team_id=default_team.id,
            created_by=admin_user.id,
            created_at=now,
            updated_at=now,
        )
        session.add(cat_deceased_fs)
        await session.flush()

        dfs_stages = [
            ("F.S Request Received", False),
            ("Insurance Payment", False),
            ("Drafted", False),
            ("Review", False),
            ("Awaiting Legal Approval", False),
            ("Payment Cheque Issued", False),
            ("Received by Legal Heirs", True),  # <- Completion stage
        ]
        for order, (name, is_completion) in enumerate(dfs_stages, 1):
            stage = CategoryStage(
                id=uuid.uuid4(),
                category_id=cat_deceased_fs.id,
                stage_name=name,
                stage_description=None,
                stage_order=order,
                is_required=True,
                is_completion_stage=is_completion,
                is_active=True,
                created_at=now,
            )
            session.add(stage)

        print(f"  [+] Category created: {cat_deceased_fs.category_name} ({len(dfs_stages)} stages)")

        # ─── Commit all seed data ───
        await session.commit()
        print("\n[SUCCESS] Database seeded successfully!")
        print(f"   Admin Login: {admin_user.user_code}")
        print(f"   Admin Password: (from SEED_ADMIN_PASSWORD env variable)")
        print(f"   Sample Users: USER001-USER005 (password: User@12345)")


if __name__ == "__main__":
    asyncio.run(seed_database())
