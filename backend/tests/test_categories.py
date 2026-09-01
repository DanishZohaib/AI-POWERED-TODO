import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_list_categories_all_users():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Standard user login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # List categories (should be allowed for all team users)
        res = await ac.get("/api/v1/categories", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)


@pytest.mark.asyncio
async def test_standard_user_cannot_create_category():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        token = login_res.json()["access_token"]

        res = await ac.post(
            "/api/v1/categories",
            json={
                "category_code": "TEST",
                "category_name": "Test Category",
                "stages": [{"stage_name": "Stage 1", "stage_order": 1}],
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403


@pytest.mark.asyncio
async def test_admin_create_and_duplicate_category():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Admin login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # Admin creates category with 3 stages (3rd is completion stage)
        create_res = await ac.post(
            "/api/v1/categories",
            json={
                "category_code": "PROC",
                "category_name": "Procurement Process",
                "description": "Standard procurement workflow",
                "allow_stage_skipping": False,
                "stages": [
                    {"stage_name": "Requisition Submitted", "stage_order": 1, "is_required": True, "is_completion_stage": False},
                    {"stage_name": "PO Issued", "stage_order": 2, "is_required": True, "is_completion_stage": False},
                    {"stage_name": "Goods Received", "stage_order": 3, "is_required": True, "is_completion_stage": True},
                ],
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert create_res.status_code == 201
        cat_data = create_res.json()
        assert cat_data["category_code"] == "PROC"
        assert len(cat_data["stages"]) == 3
        assert cat_data["stages"][2]["is_completion_stage"] is True
        cat_id = cat_data["id"]

        # Admin duplicates category
        dup_res = await ac.post(
            f"/api/v1/categories/{cat_id}/duplicate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert dup_res.status_code == 201
        dup_data = dup_res.json()
        assert "COPY" in dup_data["category_code"]
        assert len(dup_data["stages"]) == 3
