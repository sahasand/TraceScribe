"""Protocol API router."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.protocols.service import ProtocolService, DuplicateProtocolError
from app.modules.protocols.schemas import (
    ProtocolResponse,
    ProtocolListResponse,
    ProtocolUploadResponse,
    ExtractedProtocol,
)

router = APIRouter()


def get_user_id(request: Request) -> str:
    """
    Get user ID from request.
    In production, this would extract from Clerk JWT.
    """
    # TODO: Implement Clerk JWT validation
    # For now, use a header or default
    user_id = request.headers.get("X-User-ID", "dev-user")
    return user_id


def get_client_ip(request: Request) -> Optional[str]:
    """Get client IP address."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/upload")
async def upload_protocol(
    request: Request,
    file: UploadFile = File(...),
    force: bool = Query(False, description="Force upload even if duplicate detected"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload and parse a protocol PDF.

    - **file**: Protocol PDF file

    Returns parsed protocol data with extracted information.
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Read file
    file_data = await file.read()
    if len(file_data) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    user_id = get_user_id(request)
    ip_address = get_client_ip(request)

    # Get OpenAI client if available
    try:
        from app.modules.ai.openai_client import openai_client
    except ImportError:
        openai_client = None

    service = ProtocolService(db, openai_client)

    try:
        protocol = await service.upload_and_parse(
            user_id=user_id,
            file_data=file_data,
            filename=file.filename,
            ip_address=ip_address,
            force=force,
        )
    except DuplicateProtocolError as e:
        # Return duplicate information
        existing = e.existing_protocol
        return {
            "duplicate": True,
            "existing_protocol": {
                "id": existing.id,
                "title": existing.title,
                "protocol_number": existing.protocol_number,
                "sponsor": existing.sponsor,
                "uploaded_at": existing.created_at.isoformat() if existing.created_at else None,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process protocol: {e}")

    extracted = ExtractedProtocol.model_validate(protocol.extracted_data)

    return ProtocolUploadResponse(
        id=protocol.id,
        title=protocol.title,
        protocol_number=protocol.protocol_number,
        sponsor=protocol.sponsor,
        status="parsed",
        extracted_data=extracted,
        confidence_flags=extracted.confidence_flags,
    )


@router.get("", response_model=ProtocolListResponse)
async def list_protocols(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all protocols for the current user.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum records to return (1-100)
    """
    user_id = get_user_id(request)
    service = ProtocolService(db)

    return await service.list_protocols(user_id, skip=skip, limit=limit)


@router.get("/{protocol_id}", response_model=ProtocolResponse)
async def get_protocol(
    protocol_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific protocol by ID.

    - **protocol_id**: Protocol UUID
    """
    user_id = get_user_id(request)
    service = ProtocolService(db)

    protocol = await service.get_by_id(protocol_id, user_id)
    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    extracted_data = None
    if protocol.extracted_data:
        extracted_data = ExtractedProtocol.model_validate(protocol.extracted_data)

    return ProtocolResponse(
        id=protocol.id,
        user_id=protocol.user_id,
        title=protocol.title,
        protocol_number=protocol.protocol_number,
        sponsor=protocol.sponsor,
        file_path=protocol.file_path,
        extracted_data=extracted_data,
        created_at=protocol.created_at,
    )


@router.delete("/{protocol_id}")
async def delete_protocol(
    protocol_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a protocol.

    - **protocol_id**: Protocol UUID
    """
    user_id = get_user_id(request)
    ip_address = get_client_ip(request)
    service = ProtocolService(db)

    deleted = await service.delete(protocol_id, user_id, ip_address)
    if not deleted:
        raise HTTPException(status_code=404, detail="Protocol not found")

    return {"status": "deleted", "id": str(protocol_id)}
