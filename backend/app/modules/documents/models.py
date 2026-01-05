"""Document database models.

Supports both SQLite (local testing) and PostgreSQL (production).
"""

import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, JSON

from app.core.database import Base, TimestampMixin


class Document(Base, TimestampMixin):
    """Document model for storing generated documents."""

    __tablename__ = "documents"

    # Use String(36) for UUID to support both SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocol_id = Column(String(36), ForeignKey("protocols.id"), nullable=False, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    document_type = Column(String(50), nullable=False, index=True)  # icf, dmp, sap
    version = Column(Integer, default=1, nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(50), default="draft", nullable=False)  # draft, final, generating, translating, translation_failed

    # Translation & UIF storage fields
    file_size = Column(Integer, nullable=True)  # Size in bytes (fixes missing field bug)
    uif_content = Column(JSON, nullable=True)  # Complete UIF JSON structure for translation
    language = Column(String(10), default="en", nullable=False, index=True)  # ISO 639-1 code
    source_document_id = Column(String(36), nullable=True, index=True)  # Link to source document if translation

    def __repr__(self) -> str:
        lang_suffix = f" [{self.language}]" if self.language != "en" else ""
        return f"<Document {self.document_type} v{self.version}{lang_suffix}>"
