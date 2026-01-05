"""Documents API router."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import io

from app.core.database import get_db
from app.modules.documents.service import DocumentService
from app.modules.documents.schemas import (
    DocumentGenerateRequest,
    DocumentResponse,
    DocumentListResponse,
    DocumentGenerateResponse,
    DocumentTranslateRequest,
    DocumentTranslateResponse,
)

router = APIRouter()


def get_user_id(request: Request) -> str:
    """
    Get user ID from request.
    In production, this would extract from Clerk JWT.
    """
    user_id = request.headers.get("X-User-ID", "dev-user")
    return user_id


def get_client_ip(request: Request) -> Optional[str]:
    """Get client IP address."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post("/generate", response_model=DocumentGenerateResponse)
async def generate_document(
    request: Request,
    body: DocumentGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a document from a protocol.

    - **protocol_id**: Protocol UUID
    - **document_type**: Type of document (icf, dmp, sap)

    Returns generated document metadata.
    """
    user_id = get_user_id(request)
    ip_address = get_client_ip(request)

    # Get AI clients
    try:
        from app.modules.ai.openai_client import openai_client
    except ImportError:
        openai_client = None

    try:
        from app.modules.ai.claude_client import claude_client
    except ImportError:
        claude_client = None

    service = DocumentService(db, openai_client, claude_client)

    try:
        document = await service.generate_document(
            protocol_id=body.protocol_id,
            document_type=body.document_type,
            user_id=user_id,
            ip_address=ip_address,
        )

        return DocumentGenerateResponse(
            id=document.id,
            document_type=document.document_type,
            status=document.status,
            message=f"{document.document_type.upper()} generated successfully",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {e}")


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    request: Request,
    protocol_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    List all documents for the current user.

    - **protocol_id**: Optional filter by protocol UUID
    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum records to return (1-100)
    """
    user_id = get_user_id(request)
    service = DocumentService(db)

    return await service.list_documents(
        user_id=user_id,
        protocol_id=protocol_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific document by ID.

    - **document_id**: Document UUID
    """
    user_id = get_user_id(request)
    service = DocumentService(db)

    document = await service.get_by_id(document_id, user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse(
        id=document.id,
        protocol_id=document.protocol_id,
        user_id=document.user_id,
        document_type=document.document_type,
        version=document.version,
        file_path=document.file_path,
        status=document.status,
        created_at=document.created_at,
    )


@router.get("/{document_id}/download")
async def download_document(
    document_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Download a document.

    - **document_id**: Document UUID

    Returns the document file as a Word document.
    """
    user_id = get_user_id(request)
    ip_address = get_client_ip(request)
    service = DocumentService(db)

    try:
        file_bytes, filename = await service.download_document(
            document_id=document_id,
            user_id=user_id,
            ip_address=ip_address,
        )

        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download document: {e}")


@router.post("/{document_id}/translate", response_model=DocumentTranslateResponse)
async def translate_document(
    document_id: UUID,
    body: DocumentTranslateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Translate a document to another language.

    - **document_id**: Source document UUID (must be ICF in English)
    - **target_language**: ISO 639-1 language code (es, fr, de, zh, ja, ko, pt, it, nl, pl)

    Creates a new Document record with translated content.
    Only ICF documents can be translated.
    """
    user_id = get_user_id(request)
    ip_address = get_client_ip(request)

    # Get OpenAI client (required for translation)
    try:
        from app.modules.ai.openai_client import openai_client
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable (OpenAI client not configured)",
        )

    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="Translation service unavailable (OPENAI_API_KEY not set)",
        )

    service = DocumentService(db, openai_client)

    try:
        translated_doc = await service.translate_document(
            source_document_id=document_id,
            target_language=body.target_language,
            user_id=user_id,
            ip_address=ip_address,
        )

        return DocumentTranslateResponse(
            id=translated_doc.id,
            source_document_id=document_id,
            target_language=body.target_language,
            status=translated_doc.status,
            message=f"Document translated to {body.target_language.upper()} successfully",
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")
