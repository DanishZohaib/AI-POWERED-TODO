"""
API v1 router — aggregates all endpoint routers.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, categories, tasks, dashboard, reports

api_router = APIRouter()

# Authentication Router
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Users Router (Admin)
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Categories Router (Workflow Management)
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])

# Tasks Router (Shared Team Task Management)
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])

# Dashboard Router (Corporate Executive Analytics)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

# Reports Router (Multi-Sheet Excel Exports)
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])


@api_router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "healthy", "version": "1.0.0"}
