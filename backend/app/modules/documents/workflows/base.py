"""
Base workflow class for document generation.

All document generation workflows inherit from BaseWorkflow, which provides
the standard execution flow: generate content, polish (optional), build document.
"""

from abc import ABC, abstractmethod
from typing import Optional
import logging
import json

from app.core.docengine.schema import UniversalDocument

logger = logging.getLogger(__name__)


class WorkflowError(Exception):
    """Base exception for workflow errors."""
    pass


class ContentGenerationError(WorkflowError):
    """Error during AI content generation."""
    pass


class DocumentBuildError(WorkflowError):
    """Error during document building."""
    pass


class BaseWorkflow(ABC):
    """
    Base class for document generation workflows.

    Workflows are responsible for:
    1. Taking extracted protocol data
    2. Generating document content using AI (GPT-5 Nano)
    3. Optionally polishing content using Claude
    4. Building a UniversalDocument in UIF format

    Subclasses must implement:
    - document_type: str class attribute
    - generate_content(): AI content generation
    - build_document(): UIF document construction

    Example:
        class ICFWorkflow(BaseWorkflow):
            document_type = "icf"
            requires_polish = True

            async def generate_content(self, protocol_data: dict) -> dict:
                # Use GPT-5 Nano to generate ICF content
                ...

            def build_document(self, content: dict, protocol_data: dict) -> UniversalDocument:
                # Build UIF document from content
                ...
    """

    document_type: str = ""
    requires_polish: bool = False

    def __init__(self, openai_client=None, claude_client=None):
        """
        Initialize workflow.

        Args:
            openai_client: OpenAI client (GPT-5 Nano) for content generation
            claude_client: Claude AI client for polish
        """
        self.openai = openai_client
        self.claude = claude_client

    async def execute(
        self,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Execute the workflow to generate a UniversalDocument.

        This is the main entry point for workflow execution. It orchestrates
        the content generation, polishing, and document building steps.

        Args:
            protocol_data: Extracted protocol data from parsing
            user_id: User ID for audit logging

        Returns:
            UniversalDocument ready for DocEngine rendering

        Raises:
            ContentGenerationError: If AI content generation fails
            DocumentBuildError: If document building fails
        """
        logger.info(f"Executing {self.document_type} workflow for user {user_id}")

        try:
            # Step 1: Generate content using AI
            logger.debug(f"Generating {self.document_type} content with AI")
            content = await self.generate_content(protocol_data)
            logger.debug(f"Content generation complete: {len(content)} keys")

        except Exception as e:
            logger.error(f"Content generation failed: {e}")
            raise ContentGenerationError(f"Failed to generate {self.document_type} content: {e}") from e

        # Step 2: Polish content if required and Claude is available
        if self.requires_polish and self.claude:
            try:
                logger.debug(f"Polishing {self.document_type} content with Claude")
                content = await self.polish_content(content)
                logger.debug("Content polish complete")
            except Exception as e:
                # Polish failure is non-fatal - continue with unpolished content
                logger.warning(f"Content polish failed (continuing with unpolished): {e}")

        # Step 3: Build the UIF document
        try:
            logger.debug(f"Building {self.document_type} UniversalDocument")
            document = self.build_document(content, protocol_data, user_id)
            logger.info(
                f"{self.document_type.upper()} document built: "
                f"{document.count_sections()} sections, "
                f"{document.count_content_blocks()} content blocks"
            )
            return document

        except Exception as e:
            logger.error(f"Document build failed: {e}")
            raise DocumentBuildError(f"Failed to build {self.document_type} document: {e}") from e

    @abstractmethod
    async def generate_content(self, protocol_data: dict) -> dict:
        """
        Generate document content using AI.

        This method should use the OpenAI client (GPT-5 Nano) to generate
        the core document content based on the protocol data.

        Args:
            protocol_data: Extracted protocol data from parsing

        Returns:
            Dictionary of generated content sections

        Raises:
            Exception: If content generation fails
        """
        pass

    @abstractmethod
    def build_document(
        self,
        content: dict,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Build UniversalDocument from generated content.

        This method constructs the final UIF document structure from
        the AI-generated content and protocol data.

        Args:
            content: Generated content from generate_content()
            protocol_data: Original protocol data
            user_id: User ID for document metadata

        Returns:
            UniversalDocument in UIF format
        """
        pass

    async def polish_content(self, content: dict) -> dict:
        """
        Polish content using Claude.

        Override this method in subclasses to customize polishing behavior.
        The default implementation uses Claude's polish_regulatory_text method.

        Args:
            content: Content dictionary to polish

        Returns:
            Polished content dictionary
        """
        if not self.claude:
            return content

        try:
            polished_json = await self.claude.polish_regulatory_text(
                content=json.dumps(content, indent=2),
                document_type=self.document_type.upper(),
                guidelines="Ensure 6-8th grade reading level, use plain language, avoid medical jargon"
            )
            return self._parse_json_response(polished_json)
        except Exception as e:
            logger.warning(f"Polish failed, returning original content: {e}")
            return content

    def _parse_json_response(self, response: str) -> dict:
        """
        Parse JSON from AI response, handling markdown code blocks.

        AI models sometimes wrap JSON in markdown code blocks. This method
        handles that case and extracts the raw JSON.

        Args:
            response: AI response string (possibly with markdown)

        Returns:
            Parsed dictionary

        Raises:
            json.JSONDecodeError: If JSON parsing fails
        """
        json_str = response.strip()

        # Handle markdown code blocks
        if json_str.startswith("```"):
            lines = json_str.split("\n")
            # Find the actual JSON content between ``` markers
            start_idx = 0
            end_idx = len(lines)

            for i, line in enumerate(lines):
                if line.startswith("```") and i == 0:
                    start_idx = 1
                    # Handle ```json marker
                    if lines[0].startswith("```json"):
                        start_idx = 1
                elif line.startswith("```") and i > 0:
                    end_idx = i
                    break

            json_str = "\n".join(lines[start_idx:end_idx])

        return json.loads(json_str.strip())

    def _get_metadata_value(
        self,
        protocol_data: dict,
        key: str,
        default: str = "",
    ) -> str:
        """
        Safely get a value from protocol metadata.

        Args:
            protocol_data: Protocol data dictionary
            key: Key to retrieve from metadata
            default: Default value if key not found

        Returns:
            Value from metadata or default
        """
        metadata = protocol_data.get("metadata", {})
        if isinstance(metadata, dict):
            return metadata.get(key, default)
        return default

    def _get_design_value(
        self,
        protocol_data: dict,
        key: str,
        default: str = "",
    ) -> str:
        """
        Safely get a value from protocol design data.

        Args:
            protocol_data: Protocol data dictionary
            key: Key to retrieve from design
            default: Default value if key not found

        Returns:
            Value from design or default
        """
        design = protocol_data.get("design", {})
        if isinstance(design, dict):
            return design.get(key, default)
        return default

    def _get_ip_value(
        self,
        protocol_data: dict,
        key: str,
        default: str = "",
    ) -> str:
        """
        Safely get a value from investigational product data.

        Args:
            protocol_data: Protocol data dictionary
            key: Key to retrieve from investigational_product
            default: Default value if key not found

        Returns:
            Value from investigational_product or default
        """
        ip = protocol_data.get("investigational_product", {})
        if isinstance(ip, dict):
            return ip.get(key, default)
        return default

    def _format_list_items(self, items: list) -> list:
        """
        Format a list of items for UIF list blocks.

        Handles various input formats and normalizes to strings.

        Args:
            items: List of items (may be strings, dicts, etc.)

        Returns:
            List of formatted string items
        """
        formatted = []
        for item in items:
            if isinstance(item, str):
                formatted.append(item.strip())
            elif isinstance(item, dict):
                # Try common keys for text content
                text = item.get("text", "") or item.get("content", "") or item.get("name", "")
                if text:
                    formatted.append(str(text).strip())
            else:
                formatted.append(str(item).strip())
        return [item for item in formatted if item]  # Filter empty items
