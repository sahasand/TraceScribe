"""Document service for business logic."""

import uuid
import logging
import copy
import re
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import audit_log, AuditLogger
from app.core.storage import storage
from app.core.docengine import doc_engine
from app.core.docengine.schema import UniversalDocument
from app.modules.documents.models import Document
from app.modules.documents.schemas import (
    DocumentResponse,
    DocumentListResponse,
)
from app.modules.documents.workflows import (
    ICFGuruWorkflow,
    DMPWorkflow,
    SAPWorkflow,
)
from app.modules.protocols.models import Protocol

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document operations."""

    def __init__(
        self,
        db: AsyncSession,
        openai_client=None,
        claude_client=None,
    ):
        """
        Initialize service.

        Args:
            db: Database session
            openai_client: OpenAI AI client (GPT-5 Nano - PRIMARY for all document types)
            claude_client: Claude AI client (used for SAP polish only)
        """
        self.db = db
        self.openai_client = openai_client
        self.claude_client = claude_client

        # Initialize workflows - all use GPT-5 Nano
        self.workflows = {
            "icf": ICFGuruWorkflow(openai_client, claude_client),  # GPT-5 Nano for content
            "dmp": DMPWorkflow(openai_client, claude_client),  # GPT-5 Nano for content
            "sap": SAPWorkflow(openai_client, claude_client),  # GPT-5 Nano for content, Claude for polish
        }

    async def generate_document(
        self,
        protocol_id: uuid.UUID,
        document_type: str,
        user_id: str,
        ip_address: Optional[str] = None,
    ) -> Document:
        """
        Generate a document from a protocol.

        Args:
            protocol_id: Protocol UUID
            document_type: Type of document (icf, dmp, sap)
            user_id: User ID
            ip_address: Optional client IP

        Returns:
            Generated document
        """
        logger.info(f"Generating {document_type} for protocol {protocol_id}")

        # Get protocol
        protocol = await self._get_protocol(protocol_id, user_id)
        if not protocol:
            raise ValueError("Protocol not found")

        if not protocol.extracted_data:
            raise ValueError("Protocol has no extracted data")

        # Get workflow
        workflow = self.workflows.get(document_type)
        if not workflow:
            raise ValueError(f"Unknown document type: {document_type}")

        # Get next version number
        version = await self._get_next_version(protocol_id, document_type, user_id)

        # Create document record with generating status
        document = Document(
            protocol_id=str(protocol_id),
            user_id=user_id,
            document_type=document_type,
            version=version,
            file_path="",  # Will be updated after generation
            status="generating",
        )
        self.db.add(document)
        await self.db.flush()

        try:
            # Execute workflow to get UIF document
            uif_document = await workflow.execute(
                protocol_data=protocol.extracted_data,
                user_id=user_id,
            )

            # Render with DocEngine and upload to storage
            result = await doc_engine.render_and_upload(
                document=uif_document,
                user_id=user_id,
                protocol_id=str(protocol_id),
                version=version,
            )

            # Update document record
            document.file_path = result.file_path
            document.file_size = result.file_size
            document.uif_content = uif_document.model_dump(mode='json')  # Save UIF for translation
            document.language = "en"  # Set language for English documents
            document.status = "draft"

            # Audit log
            await audit_log(
                db=self.db,
                user_id=user_id,
                action=AuditLogger.GENERATE,
                resource_type=AuditLogger.DOCUMENT,
                resource_id=document.id,
                details={
                    "document_type": document_type,
                    "version": version,
                    "protocol_id": str(protocol_id),
                    "file_size": result.file_size,
                },
                ip_address=ip_address,
            )

            logger.info(f"Document generated: {document.id}")
            return document

        except Exception as e:
            # Update status to failed
            document.status = "failed"
            logger.error(f"Document generation failed: {e}")
            raise

    async def get_by_id(
        self,
        document_id: uuid.UUID,
        user_id: str,
    ) -> Optional[Document]:
        """
        Get a document by ID.

        Args:
            document_id: Document UUID
            user_id: User ID for access control

        Returns:
            Document if found and owned by user
        """
        result = await self.db.execute(
            select(Document).where(
                Document.id == str(document_id),  # Convert UUID to string
                Document.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_documents(
        self,
        user_id: str,
        protocol_id: Optional[uuid.UUID] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> DocumentListResponse:
        """
        List documents for a user.

        Args:
            user_id: User ID
            protocol_id: Optional filter by protocol
            skip: Offset for pagination
            limit: Maximum results

        Returns:
            DocumentListResponse with documents and total count
        """
        # Build query
        query = select(Document).where(Document.user_id == user_id)
        count_query = select(func.count(Document.id)).where(Document.user_id == user_id)

        if protocol_id:
            query = query.where(Document.protocol_id == str(protocol_id))
            count_query = count_query.where(Document.protocol_id == str(protocol_id))

        # Get total count
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get documents
        result = await self.db.execute(
            query
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        documents = result.scalars().all()

        return DocumentListResponse(
            documents=[self._to_response(d) for d in documents],
            total=total,
        )

    async def download_document(
        self,
        document_id: uuid.UUID,
        user_id: str,
        ip_address: Optional[str] = None,
    ) -> tuple[bytes, str]:
        """
        Download a document.

        Args:
            document_id: Document UUID
            user_id: User ID
            ip_address: Optional client IP

        Returns:
            Tuple of (file_bytes, filename)
        """
        document = await self.get_by_id(document_id, user_id)
        if not document:
            raise ValueError("Document not found")

        # Download from storage
        file_bytes = await storage.download_file(document.file_path)

        # Generate filename (include language if not English)
        lang_suffix = f"_{document.language}" if document.language != "en" else ""
        filename = f"{document.document_type}{lang_suffix}_v{document.version}.docx"

        # Audit log
        await audit_log(
            db=self.db,
            user_id=user_id,
            action=AuditLogger.DOWNLOAD,
            resource_type=AuditLogger.DOCUMENT,
            resource_id=document_id,
            details={"filename": filename},
            ip_address=ip_address,
        )

        return file_bytes, filename

    async def _get_protocol(
        self,
        protocol_id: uuid.UUID,
        user_id: str,
    ) -> Optional[Protocol]:
        """Get protocol by ID."""
        result = await self.db.execute(
            select(Protocol).where(
                Protocol.id == str(protocol_id),  # Convert UUID to string
                Protocol.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def _get_next_version(
        self,
        protocol_id: uuid.UUID,
        document_type: str,
        user_id: str,
    ) -> int:
        """Get next version number for a document type."""
        result = await self.db.execute(
            select(func.max(Document.version)).where(
                Document.protocol_id == str(protocol_id),
                Document.document_type == document_type,
                Document.user_id == user_id,
            )
        )
        max_version = result.scalar() or 0
        return max_version + 1

    def _to_response(self, document: Document) -> DocumentResponse:
        """Convert Document model to response schema."""
        return DocumentResponse(
            id=document.id,
            protocol_id=document.protocol_id,
            user_id=document.user_id,
            document_type=document.document_type,
            version=document.version,
            file_path=document.file_path,
            status=document.status,
            created_at=document.created_at,
            file_size=document.file_size,
            language=document.language,
            source_document_id=document.source_document_id,
        )

    async def translate_document(
        self,
        source_document_id: uuid.UUID,
        target_language: str,
        user_id: str,
        ip_address: Optional[str] = None,
    ) -> Document:
        """
        Translate an existing ICF document to a new language.

        Args:
            source_document_id: UUID of source document (must be English ICF)
            target_language: ISO 639-1 code (es, fr, de, zh, ja, ko, pt, it, nl, pl)
            user_id: User ID for access control
            ip_address: Optional client IP for audit log

        Returns:
            Newly created translated Document

        Raises:
            ValueError: If source not found, not ICF, or no UIF content
        """
        # 1. Get source document
        source_doc = await self.get_by_id(source_document_id, user_id)
        if not source_doc:
            raise ValueError("Source document not found")

        if source_doc.document_type != "icf":
            raise ValueError("Translation only supported for ICF documents")

        if not source_doc.uif_content:
            raise ValueError(
                "Source document has no UIF content. "
                "Please regenerate the document to enable translation."
            )

        # 2. Parse UIF
        uif_document = UniversalDocument(**source_doc.uif_content)

        # 3. Calculate version for this language
        version = await self._get_next_version_for_language(
            protocol_id=source_doc.protocol_id,
            document_type=source_doc.document_type,
            language=target_language,
            user_id=user_id,
        )

        # 4. Create translating document record
        translated_doc = Document(
            protocol_id=source_doc.protocol_id,
            user_id=user_id,
            document_type=source_doc.document_type,
            version=version,
            file_path="",
            status="translating",
            language=target_language,
            source_document_id=str(source_document_id),
        )
        self.db.add(translated_doc)
        await self.db.flush()

        try:
            # 5. Translate UIF content
            logger.info(f"Translating document {source_document_id} to {target_language}")
            translated_uif = await self._translate_uif(uif_document, target_language)

            # 6. Render translated UIF to Word
            result = await doc_engine.render_and_upload(
                document=translated_uif,
                user_id=user_id,
                protocol_id=source_doc.protocol_id,
                version=version,
            )

            # 7. Update record
            translated_doc.file_path = result.file_path
            translated_doc.file_size = result.file_size
            translated_doc.uif_content = translated_uif.model_dump(mode='json')
            translated_doc.status = "draft"

            # 8. Audit log
            await audit_log(
                db=self.db,
                user_id=user_id,
                action="TRANSLATE",
                resource_type=AuditLogger.DOCUMENT,
                resource_id=translated_doc.id,
                details={
                    "source_document_id": str(source_document_id),
                    "target_language": target_language,
                    "document_type": source_doc.document_type,
                    "version": version,
                    "file_size": result.file_size,
                },
                ip_address=ip_address,
            )

            logger.info(
                f"Translation complete: {translated_doc.id} "
                f"(en → {target_language})"
            )
            await self.db.commit()
            return translated_doc

        except Exception as e:
            translated_doc.status = "failed"
            logger.error(f"Translation failed for {source_document_id}: {e}")
            raise

    async def _translate_uif(
        self,
        uif: UniversalDocument,
        target_language: str,
    ) -> UniversalDocument:
        """
        Translate all text content in UIF to target language.

        OPTIMIZED: Uses parallel batched translation for 10x faster performance.

        Args:
            uif: Source UniversalDocument
            target_language: ISO 639-1 language code

        Returns:
            Translated UniversalDocument
        """
        from app.modules.documents.translation import ParallelTranslator

        translator = ParallelTranslator(self.openai_client)
        return await translator.translate_uif(uif, target_language)

    async def _get_next_version_for_language(
        self,
        protocol_id: str,
        document_type: str,
        language: str,
        user_id: str,
    ) -> int:
        """Get next version number for a specific language."""
        result = await self.db.execute(
            select(func.max(Document.version)).where(
                Document.protocol_id == str(protocol_id),
                Document.document_type == document_type,
                Document.language == language,
                Document.user_id == user_id,
            )
        )
        max_version = result.scalar() or 0
        return max_version + 1
