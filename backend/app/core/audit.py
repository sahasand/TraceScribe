"""Audit logging for 21 CFR Part 11 compliance.

Supports both SQLite (local testing) and PostgreSQL (production).
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import Column, String, DateTime, Text, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from .database import Base


class AuditLog(Base):
    """Audit log table for compliance tracking."""

    __tablename__ = "audit_logs"

    # Use String for UUID to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(String(255), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(36), nullable=True, index=True)  # UUID as string
    details = Column(JSON, nullable=True)  # JSON works on both SQLite and PostgreSQL
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)


class AuditLogger:
    """Audit logger for tracking document actions."""

    # Action constants
    UPLOAD = "UPLOAD"
    PARSE = "PARSE"
    GENERATE = "GENERATE"
    DOWNLOAD = "DOWNLOAD"
    DELETE = "DELETE"
    UPDATE = "UPDATE"
    VIEW = "VIEW"
    TRANSLATE = "TRANSLATE"

    # Resource type constants
    PROTOCOL = "protocol"
    DOCUMENT = "document"
    USER = "user"
    SUBSCRIPTION = "subscription"

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[uuid.UUID] = None,
        details: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Log an audit event.

        Args:
            user_id: ID of user performing action
            action: Action type (UPLOAD, GENERATE, etc.)
            resource_type: Type of resource (protocol, document, etc.)
            resource_id: Optional UUID of the resource
            details: Optional additional details as JSON
            ip_address: Optional client IP address
            user_agent: Optional client user agent

        Returns:
            Created audit log entry
        """
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        self.db.add(audit_entry)
        await self.db.flush()

        return audit_entry


async def audit_log(
    db: AsyncSession,
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[uuid.UUID] = None,
    details: Optional[dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """
    Convenience function for logging audit events.

    Args:
        db: Database session
        user_id: ID of user performing action
        action: Action type
        resource_type: Type of resource
        resource_id: Optional UUID of the resource
        details: Optional additional details
        ip_address: Optional client IP
        user_agent: Optional user agent

    Returns:
        Created audit log entry
    """
    logger = AuditLogger(db)
    return await logger.log(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
