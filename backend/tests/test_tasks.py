import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_shared_team_tasks_list():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # User 1 Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

        # List all team tasks (Default view='all' returns shared workspace tasks)
        res = await ac.get("/api/v1/tasks", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert "items" in data
        assert "total" in data


@pytest.mark.asyncio
async def test_create_and_delegate_task():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Admin login
        admin_login = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        admin_token = admin_login.json()["access_token"]

        # Get a category ID
        cats_res = await ac.get("/api/v1/categories", headers={"Authorization": f"Bearer {admin_token}"})
        categories = cats_res.json()

        if not categories:
            # Create a test category if seed not present in test db
            cat_res = await ac.post(
                "/api/v1/categories",
                json={
                    "category_code": "FS",
                    "category_name": "Final Settlement",
                    "stages": [
                        {"stage_name": "Clearance Received", "stage_order": 1},
                        {"stage_name": "Payment Processed", "stage_order": 2, "is_completion_stage": True},
                    ],
                },
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            cat_id = cat_res.json()["id"]
        else:
            cat_id = categories[0]["id"]

        # User 1 Login
        u1_login = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "USER001", "password": "User@12345"},
        )
        u1_token = u1_login.json()["access_token"]
        u1_id = u1_login.json()["user"]["id"]

        # Create Task
        task_res = await ac.post(
            "/api/v1/tasks",
            json={
                "title": "Employee Clearance — Muhammad Ali",
                "description": "Process final settlement clearance checklist",
                "category_id": cat_id,
                "priority": "HIGH",
            },
            headers={"Authorization": f"Bearer {u1_token}"},
        )
        assert task_res.status_code == 201
        task_data = task_res.json()
        assert "task_number" in task_data
        assert len(task_data["stages"]) >= 1
        task_id = task_data["id"]

        # Delegate Task to Admin
        admin_id = admin_login.json()["user"]["id"]
        delegate_res = await ac.post(
            f"/api/v1/tasks/{task_id}/delegate",
            json={
                "delegated_to": admin_id,
                "reason": "Escalating for admin review and signoff",
            },
            headers={"Authorization": f"Bearer {u1_token}"},
        )
        assert delegate_res.status_code == 200
        del_data = delegate_res.json()
        assert del_data["assigned_to"] == admin_id
        assert len(del_data["delegations"]) == 1
        assert del_data["delegations"][0]["reason"] == "Escalating for admin review and signoff"
