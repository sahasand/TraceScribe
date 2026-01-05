"""
Document generation workflows for TraceScribe.

Workflows take protocol data, use AI to generate content, and output
UniversalDocument objects in UIF format for DocEngine rendering.

Available workflows:
- ICFGuruWorkflow: Informed Consent Form (25 focused subsections, no polish needed)
- DMPWorkflow: Data Management Plan (no polish required)
- SAPWorkflow: Statistical Analysis Plan (requires Claude polish)
"""

from .base import BaseWorkflow, WorkflowError, ContentGenerationError, DocumentBuildError
from .icf_guru import ICFGuruWorkflow
from .dmp import DMPWorkflow
from .sap import SAPWorkflow

__all__ = [
    "BaseWorkflow",
    "WorkflowError",
    "ContentGenerationError",
    "DocumentBuildError",
    "ICFGuruWorkflow",
    "DMPWorkflow",
    "SAPWorkflow",
]
