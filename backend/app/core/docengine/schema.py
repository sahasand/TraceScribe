"""
Universal Intermediate Format (UIF) Schema for TraceScribe.

This module defines the UIF schema - a standardized JSON structure for representing
clinical trial documents before rendering to Word format.

The UIF provides:
- Document-agnostic content representation
- Consistent styling and formatting
- Support for all clinical trial document types (ICF, DMP, SAP)
- Compliance metadata (21 CFR Part 11)
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List, Union, Any
from pydantic import BaseModel, Field


class ContentBlockType(str, Enum):
    """Types of content blocks in a UIF document."""

    PARAGRAPH = "paragraph"
    HEADING = "heading"
    PAGE_BREAK = "page_break"
    BULLET_LIST = "bullet_list"
    NUMBERED_LIST = "numbered_list"
    TABLE = "table"
    SIGNATURE_BLOCK = "signature_block"


class ListStyle(str, Enum):
    """Numbering styles for lists."""

    BULLET = "bullet"
    DECIMAL = "decimal"
    ROMAN_UPPER = "roman_upper"
    ROMAN_LOWER = "roman_lower"
    LETTER_UPPER = "letter_upper"
    LETTER_LOWER = "letter_lower"


class Alignment(str, Enum):
    """Text alignment options."""

    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    JUSTIFY = "justify"


class InlineFormat(BaseModel):
    """Defines formatting for a range of characters within text content."""

    start: int = Field(..., description="Start character index (0-based)")
    end: int = Field(..., description="End character index (exclusive)")
    bold: bool = False
    italic: bool = False
    underline: bool = False


class InlineFormatting(BaseModel):
    """Container for inline formatting ranges within a text block."""

    ranges: List[InlineFormat] = Field(default_factory=list)


class TableCell(BaseModel):
    """A single cell within a table."""

    content: str = ""
    colspan: int = 1
    rowspan: int = 1
    alignment: Alignment = Alignment.LEFT
    vertical_alignment: str = "center"
    background_color: Optional[str] = None


class TableBlock(BaseModel):
    """Table structure for embedding in content blocks."""

    headers: List[str] = Field(default_factory=list)
    rows: List[List[Union[str, TableCell]]] = Field(default_factory=list)
    column_widths: Optional[List[float]] = None
    style: str = "Table Grid"
    header_background: str = "#CCCCCC"


class SignatureLine(BaseModel):
    """A signature line within a signature block."""

    label: str = Field(..., description="Label for the signature line (e.g., 'Participant Signature')")
    line_width_inches: float = Field(default=3.5, description="Width of the signature line")


class SignatureBlock(BaseModel):
    """Signature block for consent forms and other documents requiring signatures."""

    preamble: Optional[str] = Field(
        None,
        description="Text appearing before the signature lines"
    )
    lines: List[SignatureLine] = Field(default_factory=list)


class ContentBlock(BaseModel):
    """
    A block of content within a section.

    Represents paragraphs, headings, lists, tables, page breaks, or signature blocks.
    """

    type: ContentBlockType = Field(..., description="Type of content block")
    content: str = Field(default="", description="Text content for paragraphs/headings")
    level: Optional[int] = Field(
        default=None,
        description="Heading level (1-4) for heading blocks"
    )
    formatting: Optional[InlineFormatting] = Field(
        default=None,
        description="Inline formatting ranges for text content"
    )
    alignment: Alignment = Field(default=Alignment.LEFT)
    spacing_before: int = Field(default=0, description="Space before in points")
    spacing_after: int = Field(default=0, description="Space after in points")

    # List-specific fields
    items: Optional[List[Union[str, dict]]] = Field(
        default=None,
        description="List items for bullet/numbered lists"
    )
    list_style: Optional[ListStyle] = Field(
        default=None,
        description="Style for numbered lists"
    )

    # Table-specific field
    table: Optional[TableBlock] = Field(
        default=None,
        description="Table data for table blocks"
    )

    # Signature-specific field
    signature: Optional[SignatureBlock] = Field(
        default=None,
        description="Signature block data"
    )


class Section(BaseModel):
    """
    A document section with heading and content.

    Sections form the hierarchical structure of the document,
    supporting up to 4 levels of nesting.
    """

    id: str = Field(..., description="Unique section identifier")
    level: int = Field(
        ...,
        ge=1,
        le=4,
        description="Section level (1-4)"
    )
    heading: str = Field(..., description="Section heading text")
    content_blocks: List[ContentBlock] = Field(default_factory=list)
    subsections: List[Section] = Field(default_factory=list)


class DocumentStyling(BaseModel):
    """Document-wide styling configuration."""

    default_font: str = "Arial"
    default_font_size: int = Field(default=11, description="Body text size in points")
    heading_font: str = "Arial"
    heading_1_size: int = 16
    heading_2_size: int = 14
    heading_3_size: int = 12
    heading_4_size: int = 11
    line_spacing: float = 1.15
    heading_1_bold: bool = True
    heading_2_bold: bool = True
    heading_3_bold: bool = True
    heading_4_bold: bool = False
    heading_1_color: Optional[str] = None
    heading_2_color: Optional[str] = None
    heading_3_color: Optional[str] = None
    heading_4_color: Optional[str] = None


class PageSetup(BaseModel):
    """Page layout configuration."""

    page_width: float = Field(default=8.5, description="Page width in inches")
    page_height: float = Field(default=11.0, description="Page height in inches")
    margin_top: float = Field(default=1.0, description="Top margin in inches")
    margin_bottom: float = Field(default=1.0, description="Bottom margin in inches")
    margin_left: float = Field(default=1.0, description="Left margin in inches")
    margin_right: float = Field(default=1.0, description="Right margin in inches")


class HeaderFooter(BaseModel):
    """Header and footer configuration."""

    header_text: Optional[str] = None
    footer_text: Optional[str] = None
    show_page_numbers: bool = True
    page_number_position: str = "footer_right"
    include_total_pages: bool = False


class ComplianceMetadata(BaseModel):
    """Compliance and audit metadata for 21 CFR Part 11."""

    generated_by: str = Field(
        default="gemini",
        description="AI model that generated the document"
    )
    polished_by: Optional[str] = Field(
        default=None,
        description="AI model that polished/refined the document"
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    regulatory_framework: Optional[str] = Field(
        default=None,
        description="Applicable regulatory framework (e.g., 'FDA 21 CFR 50.25')"
    )
    version: str = Field(default="1.0")
    review_status: str = Field(default="draft")


class DocumentMetadata(BaseModel):
    """Document metadata for identification and versioning."""

    protocol_number: Optional[str] = None
    protocol_title: Optional[str] = None
    sponsor: Optional[str] = None
    document_version: str = "1.0"
    effective_date: Optional[datetime] = None
    irb_protocol_number: Optional[str] = None
    site_name: Optional[str] = None


class UniversalDocument(BaseModel):
    """
    Universal Intermediate Format (UIF) Document.

    This is the main schema that represents a complete clinical trial document
    ready for rendering to Word format.
    """

    # Schema version
    uif_version: str = Field(default="1.0", description="UIF schema version")

    # Document identification
    document_type: str = Field(
        ...,
        description="Document type (icf, dmp, sap)"
    )
    title: str = Field(..., description="Document title")

    # Document metadata
    metadata: DocumentMetadata = Field(default_factory=DocumentMetadata)

    # Styling configuration
    styling: DocumentStyling = Field(default_factory=DocumentStyling)
    page_setup: PageSetup = Field(default_factory=PageSetup)
    header_footer: HeaderFooter = Field(default_factory=HeaderFooter)

    # Document content
    sections: List[Section] = Field(default_factory=list)

    # Compliance metadata
    compliance: ComplianceMetadata = Field(default_factory=ComplianceMetadata)

    def get_all_sections_flat(self) -> List[Section]:
        """
        Get all sections in flat order (depth-first).

        Returns:
            List of all sections including nested subsections.
        """
        result = []

        def collect(sections: List[Section]):
            for section in sections:
                result.append(section)
                collect(section.subsections)

        collect(self.sections)
        return result

    def count_sections(self) -> int:
        """Count total number of sections including subsections."""
        return len(self.get_all_sections_flat())

    def count_content_blocks(self) -> int:
        """Count total number of content blocks."""
        total = 0
        for section in self.get_all_sections_flat():
            total += len(section.content_blocks)
        return total


# Enable forward references for recursive Section model
Section.model_rebuild()
