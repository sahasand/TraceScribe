"""Base document generator class."""

import os
import uuid
import tempfile
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Generic, TypeVar, Optional

from docxtpl import DocxTemplate

from app.core.config import settings
from app.core.storage import storage

logger = logging.getLogger(__name__)

T = TypeVar("T")


class BaseDocumentGenerator(ABC, Generic[T]):
    """Base class for document generators."""

    template_name: str = ""
    document_type: str = ""
    requires_polish: bool = False

    def __init__(self, gemini_client=None, claude_client=None):
        """
        Initialize generator.

        Args:
            gemini_client: Gemini AI client for content generation
            claude_client: Claude AI client for polish (if requires_polish=True)
        """
        self.gemini = gemini_client
        self.claude = claude_client
        self.template_dir = Path(__file__).parent.parent.parent.parent / "templates"

    @property
    def template_path(self) -> Path:
        """Get path to document template."""
        return self.template_dir / self.document_type / self.template_name

    async def generate(
        self,
        protocol_id: str,
        protocol_data: dict,
        user_id: str,
    ) -> str:
        """
        Generate a document from protocol data.

        Args:
            protocol_id: Protocol UUID
            protocol_data: Extracted protocol data
            user_id: User ID for storage path

        Returns:
            Path to generated document in storage
        """
        logger.info(f"Generating {self.document_type} for protocol {protocol_id}")

        # Extract data specific to this document type
        extracted = await self.extract_for_document(protocol_data)

        # Polish with Claude if required
        if self.requires_polish and self.claude:
            logger.info("Polishing content with Claude")
            extracted = await self.polish_content(extracted)

        # Build template context
        context = self.build_template_context(extracted)

        # Generate document
        output_path = await self._render_document(context, protocol_id, user_id)

        logger.info(f"Generated document: {output_path}")
        return output_path

    async def _render_document(
        self,
        context: dict,
        protocol_id: str,
        user_id: str,
    ) -> str:
        """Render document using template."""
        # Check if template exists
        if not self.template_path.exists():
            logger.warning(f"Template not found: {self.template_path}, generating without template")
            return await self._generate_without_template(context, protocol_id, user_id)

        # Load and render template
        doc = DocxTemplate(self.template_path)
        doc.render(context)

        # Save to temp file
        temp_filename = f"{self.document_type}_{protocol_id}_{uuid.uuid4().hex[:8]}.docx"
        temp_path = Path(tempfile.gettempdir()) / temp_filename

        doc.save(temp_path)

        # Upload to storage
        with open(temp_path, "rb") as f:
            file_data = f.read()

        storage_path = await storage.upload_file(
            file_data=file_data,
            file_name=f"{self.document_type}_v1.docx",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            folder=f"documents/{user_id}/{protocol_id}",
        )

        # Clean up temp file
        temp_path.unlink(missing_ok=True)

        return storage_path

    async def _generate_without_template(
        self,
        context: dict,
        protocol_id: str,
        user_id: str,
    ) -> str:
        """Generate document without template (fallback)."""
        from docx import Document
        from docx.shared import Pt, Inches
        from docx.enum.text import WD_ALIGN_PARAGRAPH

        doc = Document()

        # Set up document
        section = doc.sections[0]
        section.page_width = Inches(8.5)
        section.page_height = Inches(11)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

        # Add title
        title = doc.add_heading(context.get("title", self.document_type.upper()), 0)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Add content based on document type
        await self._add_content_to_document(doc, context)

        # Save and upload
        temp_filename = f"{self.document_type}_{protocol_id}_{uuid.uuid4().hex[:8]}.docx"
        temp_path = Path(tempfile.gettempdir()) / temp_filename

        doc.save(temp_path)

        with open(temp_path, "rb") as f:
            file_data = f.read()

        storage_path = await storage.upload_file(
            file_data=file_data,
            file_name=f"{self.document_type}_v1.docx",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            folder=f"documents/{user_id}/{protocol_id}",
        )

        temp_path.unlink(missing_ok=True)

        return storage_path

    async def _add_content_to_document(self, doc, context: dict) -> None:
        """Add content to document (override in subclasses)."""
        pass

    @abstractmethod
    async def extract_for_document(self, protocol_data: dict) -> T:
        """
        Extract data needed for this document type.

        Args:
            protocol_data: Full extracted protocol data

        Returns:
            Extracted data specific to this document
        """
        pass

    @abstractmethod
    def build_template_context(self, extracted: T) -> dict:
        """
        Build context dictionary for template rendering.

        Args:
            extracted: Extracted document data

        Returns:
            Template context dictionary
        """
        pass

    async def polish_content(self, extracted: T) -> T:
        """
        Polish content using Claude (override if needed).

        Args:
            extracted: Extracted document data

        Returns:
            Polished document data
        """
        return extracted
