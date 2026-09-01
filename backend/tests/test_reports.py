import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_excel_report_export():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # User 1 Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Export Excel Report
        res = await ac.get("/api/v1/reports/export/excel", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res.headers["content-type"]
        assert "Content-Disposition" in res.headers
        assert len(res.content) > 1000  # Valid binary excel payload
