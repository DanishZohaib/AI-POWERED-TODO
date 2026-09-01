import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_dashboard_summary_kpis():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # User 1 Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Fetch Dashboard Summary (Shared Team Workspace Default)
        res = await ac.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()

        assert "total_tasks" in data
        assert "pending_tasks" in data
        assert "completed_tasks" in data
        assert "overdue_tasks" in data
        assert "completion_rate" in data
        assert "status_distribution" in data
        assert "category_statistics" in data
        assert "priority_distribution" in data
        assert "recent_activities" in data
