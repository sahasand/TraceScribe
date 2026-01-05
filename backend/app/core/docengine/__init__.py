"""
Unified Document Engine for TraceScribe.

This module provides a standardized approach to generating Word documents
from UIF (Unified Intermediate Format) data structures.

Main Components:
- DocEngine: Central orchestrator for rendering UIF to Word
- UniversalDocument: The UIF schema representing a complete document
- Builders: Specialized renderers for sections, tables, lists, and styles

Example usage:
    from app.core.docengine import doc_engine, UniversalDocument

    uif = UniversalDocument(
        document_type="icf",
        title="Informed Consent Form",
        sections=[...]
    )

    # Render to file
    path = doc_engine.render(uif)

    # Or render and upload to storage
    result = await doc_engine.render_and_upload(uif, user_id, protocol_id, version)
"""

# Engine exports
from .engine import DocEngine, DocEngineResult, doc_engine

# Schema exports
from .schema import (
    UniversalDocument,
    Section as UIFSection,
    ContentBlock as UIFContentBlock,
    ContentBlockType as UIFContentBlockType,
    ListStyle,
    Alignment as UIFAlignment,
    InlineFormat as UIFInlineFormat,
    InlineFormatting as UIFInlineFormatting,
    TableBlock,
    TableCell as UIFTableCell,
    SignatureBlock,
    SignatureLine,
    DocumentStyling,
    PageSetup,
    HeaderFooter,
    ComplianceMetadata,
    DocumentMetadata,
)

# Builder exports (for direct usage if needed)
from .builders.table import TableBuilder, TableCell
from .builders.section import (
    SectionBuilder,
    Section,
    ContentBlock,
    ContentBlockType,
    InlineFormat,
    InlineFormatting,
    Alignment,
)
from .builders.list import ListBuilder
from .builders.styles import StyleEngine

__all__ = [
    # Engine
    "DocEngine",
    "DocEngineResult",
    "doc_engine",
    # UIF Schema
    "UniversalDocument",
    "UIFSection",
    "UIFContentBlock",
    "UIFContentBlockType",
    "ListStyle",
    "UIFAlignment",
    "UIFInlineFormat",
    "UIFInlineFormatting",
    "TableBlock",
    "UIFTableCell",
    "SignatureBlock",
    "SignatureLine",
    "DocumentStyling",
    "PageSetup",
    "HeaderFooter",
    "ComplianceMetadata",
    "DocumentMetadata",
    # Builders
    "TableBuilder",
    "TableCell",
    "SectionBuilder",
    "Section",
    "ContentBlock",
    "ContentBlockType",
    "InlineFormat",
    "InlineFormatting",
    "Alignment",
    "ListBuilder",
    "StyleEngine",
]
