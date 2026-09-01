import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_sequential_workflow_stage_processing_and_autocompletion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Admin login
        admin_login = await ac.post(
            "/api/v1/auth/login",
            json={"user_code": "ADMIN001", "password": "Admin@12345"},
        )
        admin_token = admin_login.json()["access_token"]

        # Create Category with 3 Stages (Stage 2 required, Stage 3 completion stage)
        cat_res = await ac.post(
            "/api/v1/categories",
            json={
                "category_code": "PROC",
                "category_name": "Procurement Approval",
                "stages": [
                    {"stage_name": "Vendor Quotation", "stage_order": 1, "is_required": True},
                    {"stage_name": "Finance Signoff", "stage_order": 2, "is_required": True},
                    {"stage_name": "PO Issued", "stage_order": 3, "is_required": True, "is_completion_stage": True},
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert cat_res.status_code == 201
        cat_id = cat_res.json()["id"]

        # Create Task under Procurement Approval
        task_res = await ac.post(
            "/api/v1/tasks",
            json={
                "title": "Server Hardware Procurement",
                "category_id": cat_id,
                "priority": "CRITICAL",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert task_res.status_code == 201
        task_data = task_res.json()
        task_id = task_data["id"]
        stages = sorted(task_data["stages"], key=lambda x: x["stage_order"])
        stage1, stage2, stage3 = stages[0], stages[1], stages[2]

        # 1. Attempt to complete Stage 3 out-of-order -> Should FAIL with 400 Bad Request (Sequential rule)
        out_of_order_res = await ac.post(
            f"/api/v1/tasks/{task_id}/stages/{stage3['id']}/complete",
            json={"comments": "Bypassing to issue PO early"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert out_of_order_res.status_code == 400
        assert "Prior required stage" in str(out_of_order_res.json())

        # 2. Complete Stage 1 (Vendor Quotation) -> Success
        s1_res = await ac.post(
            f"/api/v1/tasks/{task_id}/stages/{stage1['id']}/complete",
            json={"comments": "Vendor quote approved at $4,500"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert s1_res.status_code == 200
        s1_data = s1_res.json()
        assert s1_data["status"] == "IN_PROGRESS"
        assert s1_data["progress_percentage"] > 0

        # 3. Complete Stage 2 (Finance Signoff)
        s2_res = await ac.post(
            f"/api/v1/tasks/{task_id}/stages/{stage2['id']}/complete",
            json={"comments": "Budget allocated"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert s2_res.status_code == 200

        # 4. Complete Stage 3 (PO Issued — Completion Stage) -> Should Auto-Complete Task
        s3_res = await ac.post(
            f"/api/v1/tasks/{task_id}/stages/{stage3['id']}/complete",
            json={"comments": "Purchase Order PO-90812 sent to vendor"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert s3_res.status_code == 200
        s3_data = s3_res.json()
        assert s3_data["status"] == "COMPLETED"
        assert s3_data["progress_percentage"] == 100.0
        assert s3_data["completed_at"] is not None

        # 5. Uncomplete Stage 3 -> Reverts status back to IN_PROGRESS
        uncomp_res = await ac.post(
            f"/api/v1/tasks/{task_id}/stages/{stage3['id']}/uncomplete",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert uncomp_res.status_code == 200
        uncomp_data = uncomp_res.json()
        assert uncomp_data["status"] == "IN_PROGRESS"
        assert uncomp_data["progress_percentage"] < 100.0
        assert uncomp_data["completed_at"] is None
