"""
Audit Log Repository — Immutable event logging.
"""

from datetime import datetime, timezone
from uuid import UUID
from typing import Any
import json

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


class AuditRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        user_id: UUID,
        action_type: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        old_value: dict[str, Any] | str | None = None,
        new_value: dict[str, Any] | str | None = None,
        team_id: UUID | None = None,
        ip_address: str | None = None,
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        old_val_str = json.dumps(old_value) if isinstance(old_value, dict) else old_value
        new_val_str = json.dumps(new_value) if isinstance(new_value, dict) else new_value

        audit_entry = AuditLog(
            user_id=user_id,
            team_id=team_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_val_str,
            new_value=new_val_str,
            timestamp=datetime.now(timezone.utc),
            ip_address=ip_address,
        )
        self.db.add(audit_entry)
        await self.db.commit()
        return audit_entry
