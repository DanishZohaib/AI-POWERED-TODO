import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_login_success():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["user_code"] == "ADMIN001"
        assert data["user"]["role"] == "POWER_ADMIN"


@pytest.mark.asyncio
async def test_login_invalid_password():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "WrongPassword"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["error_code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_non_existent_user():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "NONEXISTENT", "password": "Admin@12345"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["error_code"] == "INVALID_CREDENTIALS"
