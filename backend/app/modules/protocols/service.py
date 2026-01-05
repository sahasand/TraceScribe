"""Protocol service for business logic."""

import uuid
import hashlib
import logging
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import audit_log, AuditLogger
from app.core.storage import storage
from app.modules.protocols.models import Protocol
from app.modules.protocols.schemas import (
    ExtractedProtocol,
    ProtocolResponse,
    ProtocolListResponse,
)
from app.modules.protocols.parser import ProtocolParser

logger = logging.getLogger(__name__)


class DuplicateProtocolError(Exception):
    """Raised when duplicate protocol is detected."""

    def __init__(self, existing_protocol: Protocol):
        self.existing_protocol = existing_protocol
        super().__init__(f"Protocol already exists: {existing_protocol.id}")


class ProtocolService:
    """Service for protocol operations."""

    def __init__(self, db: AsyncSession, openai_client=None):
        """
        Initialize service.

        Args:
            db: Database session
            openai_client: Optional OpenAI client (GPT-5 Nano) for parsing
        """
        self.db = db
        self.openai_client = openai_client

    @staticmethod
    def calculate_file_hash(file_data: bytes) -> str:
        """
        Calculate SHA-256 hash of file data.

        Args:
            file_data: File bytes

        Returns:
            Hex-encoded SHA-256 hash
        """
        return hashlib.sha256(file_data).hexdigest()

    async def check_duplicate(
        self,
        file_hash: str,
        user_id: str,
    ) -> Optional[Protocol]:
        """
        Check if protocol with this hash already exists for user.

        Args:
            file_hash: SHA-256 hash of file
            user_id: User ID

        Returns:
            Existing protocol if found, None otherwise
        """
        result = await self.db.execute(
            select(Protocol).where(
                Protocol.file_hash == file_hash,
                Protocol.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def upload_and_parse(
        self,
        user_id: str,
        file_data: bytes,
        filename: str,
        ip_address: Optional[str] = None,
        force: bool = False,
    ) -> Protocol:
        """
        Upload a protocol PDF and parse it.

        Args:
            user_id: User ID
            file_data: PDF file bytes
            filename: Original filename
            ip_address: Optional client IP

        Returns:
            Created protocol with extracted data

        Raises:
            DuplicateProtocolError: If protocol with same hash already exists
        """
        logger.info(f"Uploading protocol: {filename} for user {user_id} (force={force})")

        # Calculate file hash and check for duplicates (unless force=True)
        file_hash = self.calculate_file_hash(file_data)

        if not force:
            existing = await self.check_duplicate(file_hash, user_id)
            if existing:
                logger.info(f"Duplicate protocol detected: {existing.id}")
                raise DuplicateProtocolError(existing)

        # Upload to R2 storage
        file_path = await storage.upload_file(
            file_data=file_data,
            file_name=filename,
            content_type="application/pdf",
            folder="protocols",
        )

        # Parse with GPT-5 Nano
        if self.openai_client:
            parser = ProtocolParser(self.openai_client)
            extracted = await parser.parse_with_retry(file_data)
        else:
            # Fallback for when OpenAI client not available
            extracted = ExtractedProtocol(
                metadata={"title": filename.replace(".pdf", "")},
                design={"study_type": "interventional"},
                endpoints={"primary": [], "secondary": []},
                eligibility={"inclusion": [], "exclusion": []},
            )

        # Create protocol record
        protocol = Protocol(
            user_id=user_id,
            title=extracted.metadata.title,
            protocol_number=extracted.metadata.protocol_number,
            sponsor=extracted.metadata.sponsor,
            file_path=file_path,
            file_hash=file_hash,
            extracted_data=extracted.model_dump(),
        )

        self.db.add(protocol)
        await self.db.flush()

        # Audit log
        await audit_log(
            db=self.db,
            user_id=user_id,
            action=AuditLogger.UPLOAD,
            resource_type=AuditLogger.PROTOCOL,
            resource_id=protocol.id,
            details={"filename": filename, "file_path": file_path},
            ip_address=ip_address,
        )

        await audit_log(
            db=self.db,
            user_id=user_id,
            action=AuditLogger.PARSE,
            resource_type=AuditLogger.PROTOCOL,
            resource_id=protocol.id,
            details={"confidence_flags": extracted.confidence_flags},
            ip_address=ip_address,
        )

        logger.info(f"Protocol created: {protocol.id}")
        return protocol

    async def get_by_id(
        self,
        protocol_id: uuid.UUID,
        user_id: str,
    ) -> Optional[Protocol]:
        """
        Get a protocol by ID.

        Args:
            protocol_id: Protocol UUID
            user_id: User ID for access control

        Returns:
            Protocol if found and owned by user
        """
        result = await self.db.execute(
            select(Protocol).where(
                Protocol.id == str(protocol_id),  # Convert UUID to string
                Protocol.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_protocols(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> ProtocolListResponse:
        """
        List protocols for a user.

        Args:
            user_id: User ID
            skip: Offset for pagination
            limit: Maximum results

        Returns:
            ProtocolListResponse with protocols and total count
        """
        # Get total count
        count_result = await self.db.execute(
            select(func.count(Protocol.id)).where(Protocol.user_id == user_id)
        )
        total = count_result.scalar() or 0

        # Get protocols
        result = await self.db.execute(
            select(Protocol)
            .where(Protocol.user_id == user_id)
            .order_by(Protocol.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        protocols = result.scalars().all()

        return ProtocolListResponse(
            protocols=[self._to_response(p) for p in protocols],
            total=total,
        )

    async def delete(
        self,
        protocol_id: uuid.UUID,
        user_id: str,
        ip_address: Optional[str] = None,
    ) -> bool:
        """
        Delete a protocol.

        Args:
            protocol_id: Protocol UUID
            user_id: User ID for access control
            ip_address: Optional client IP

        Returns:
            True if deleted
        """
        protocol = await self.get_by_id(protocol_id, user_id)
        if not protocol:
            return False

        # Delete from storage
        try:
            await storage.delete_file(protocol.file_path)
        except Exception as e:
            logger.warning(f"Failed to delete file from storage: {e}")

        # Delete from database
        await self.db.delete(protocol)

        # Audit log
        await audit_log(
            db=self.db,
            user_id=user_id,
            action=AuditLogger.DELETE,
            resource_type=AuditLogger.PROTOCOL,
            resource_id=protocol_id,
            details={"title": protocol.title},
            ip_address=ip_address,
        )

        return True

    def _to_response(self, protocol: Protocol) -> ProtocolResponse:
        """Convert Protocol model to response schema."""
        extracted_data = None
        if protocol.extracted_data:
            try:
                extracted_data = ExtractedProtocol.model_validate(protocol.extracted_data)
            except Exception:
                pass

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
