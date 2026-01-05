"""Protocol database models.

Supports both SQLite (local testing) and PostgreSQL (production).
"""

import uuid
from sqlalchemy import Column, String, Text, JSON

from app.core.database import Base, TimestampMixin


class Protocol(Base, TimestampMixin):
    """Protocol model for storing uploaded protocols."""

    __tablename__ = "protocols"

    # Use String(36) for UUID to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(255), nullable=False, index=True)
    title = Column(Text, nullable=False)
    protocol_number = Column(String(100), nullable=True, index=True)
    sponsor = Column(String(255), nullable=True)
    file_path = Column(Text, nullable=False)
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash for duplicate detection
    extracted_data = Column(JSON, nullable=True)  # JSON works on both databases

    def __repr__(self) -> str:
        return f"<Protocol {self.protocol_number or self.id}>"
