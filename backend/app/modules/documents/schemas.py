"""Document schemas for request/response validation."""

from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field


class DocumentGenerateRequest(BaseModel):
    """Request to generate a document."""
    protocol_id: UUID
    document_type: Literal["icf", "dmp", "sap"]


class DocumentResponse(BaseModel):
    """Document response."""
    id: UUID
    protocol_id: UUID
    user_id: str
    document_type: str
    version: int
    file_path: str
    status: str
    created_at: datetime
    file_size: Optional[int] = None
    language: str = "en"
    source_document_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """List of documents response."""
    documents: list[DocumentResponse]
    total: int


class DocumentGenerateResponse(BaseModel):
    """Response after document generation."""
    id: UUID
    document_type: str
    status: str
    message: str


class DocumentVersionResponse(BaseModel):
    """Document version information."""
    version: int
    created_at: datetime
    status: str


class DocumentTranslateRequest(BaseModel):
    """Request to translate a document."""
    target_language: Literal["es", "fr", "de", "zh", "ja", "ko", "pt", "it", "nl", "pl"]


class DocumentTranslateResponse(BaseModel):
    """Response after document translation."""
    id: UUID
    source_document_id: UUID
    target_language: str
    status: str
    message: str
