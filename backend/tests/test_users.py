import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_admin_list_users():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Admin Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # List users with Authorization header
        res = await ac.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 2
        assert len(data["items"]) >= 2


@pytest.mark.asyncio
async def test_standard_user_cannot_list_users():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Standard User Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Try to list users
        res = await ac.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 403
        data = res.json()
        assert data["error_code"] == "ADMIN_REQUIRED"


@pytest.mark.asyncio
async def test_admin_create_user():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        create_res = await ac.post(
            "/api/v1/users",
            json={
                "user_code": "USER002",
                "full_name": "Fatima Khan",
                "department": "Finance",
                "designation": "Accountant",
                "role": "STANDARD_USER",
                "temporary_password": "TempUser@123",
                "password_expiry_days": 30,
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert create_res.status_code == 201
        data = create_res.json()
        assert data["user_code"] == "USER002"
        assert data["full_name"] == "Fatima Khan"
        assert data["must_change_password"] is True
