"""Protocol schemas for request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# ============================================================================
# Extracted Protocol Data Schemas (from Gemini extraction)
# ============================================================================

class StudyMetadata(BaseModel):
    """Study metadata from protocol."""
    protocol_number: Optional[str] = None
    title: str
    sponsor: Optional[str] = None
    phase: Optional[str] = None
    indication: Optional[str] = None
    version: Optional[str] = None


class StudyDesign(BaseModel):
    """Study design information."""
    study_type: str = Field(description="interventional|observational|device")
    design: Optional[str] = Field(None, description="Full design description")
    arms: list[str] = Field(default_factory=list, description="Arm names")
    randomization_ratio: Optional[str] = None
    blinding: Optional[str] = Field(None, description="open|single-blind|double-blind")
    control: Optional[str] = Field(None, description="placebo|active|none|null")
    planned_enrollment: Optional[int] = None
    study_duration_weeks: Optional[int] = None


class Endpoints(BaseModel):
    """Study endpoints - VERBATIM from protocol."""
    primary: list[str] = Field(default_factory=list, description="Primary endpoints verbatim")
    secondary: list[str] = Field(default_factory=list, description="Secondary endpoints verbatim")


class EligibilityCriteria(BaseModel):
    """Simplified eligibility criteria."""
    inclusion: list[str] = Field(default_factory=list, description="5-10 simplified criteria")
    exclusion: list[str] = Field(default_factory=list, description="5-10 simplified criteria")
    age_range: Optional[str] = None
    sex: Optional[str] = Field(None, description="All|Male|Female")


class StudyProcedure(BaseModel):
    """Study procedure information."""
    name: str
    plain_language: Optional[str] = Field(None, description="Patient-friendly description")
    frequency: Optional[str] = None
    visits: list[str] = Field(default_factory=list, description="Which visits")
    blood_volume_ml: Optional[int] = None

    @property
    def blood_volume_tbsp(self) -> Optional[float]:
        """Convert blood volume to tablespoons (15mL = 1 tbsp)."""
        if self.blood_volume_ml:
            return round(self.blood_volume_ml / 15, 1)
        return None


class Visit(BaseModel):
    """Study visit information."""
    name: str
    timing: Optional[str] = None
    procedures: list[str] = Field(default_factory=list)
    estimated_duration_hours: Optional[float] = None


class AdverseEvent(BaseModel):
    """Adverse event information."""
    term: str = Field(description="Medical term")
    plain_language: Optional[str] = Field(None, description="Patient-friendly term")
    frequency: Optional[str] = Field(
        None,
        description="Very common (>10%)|Common (1-10%)|Uncommon (<1%)|Rare|Unknown"
    )
    severity: Optional[str] = Field(None, description="mild|moderate|severe")


class InvestigationalProduct(BaseModel):
    """Investigational product details."""
    name: str
    type: Optional[str] = Field(None, description="small molecule|biologic|device")
    route: Optional[str] = Field(None, description="oral|IV|subcutaneous|etc")
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None


class ExtractedProtocol(BaseModel):
    """Complete extracted protocol data from Gemini."""
    metadata: StudyMetadata
    design: StudyDesign
    endpoints: Endpoints
    eligibility: EligibilityCriteria
    procedures: list[StudyProcedure] = Field(default_factory=list)
    visits: list[Visit] = Field(default_factory=list)
    adverse_events: list[AdverseEvent] = Field(default_factory=list)
    investigational_product: Optional[InvestigationalProduct] = None
    confidence_flags: list[str] = Field(
        default_factory=list,
        description="Sections needing review"
    )


# ============================================================================
# API Request/Response Schemas
# ============================================================================

class ProtocolCreate(BaseModel):
    """Protocol creation request (file uploaded separately)."""
    title: Optional[str] = None


class ProtocolUpdate(BaseModel):
    """Protocol update request."""
    title: Optional[str] = None
    extracted_data: Optional[dict] = None


class ProtocolResponse(BaseModel):
    """Protocol response with extracted data."""
    id: UUID
    user_id: str
    title: str
    protocol_number: Optional[str] = None
    sponsor: Optional[str] = None
    file_path: str
    extracted_data: Optional[ExtractedProtocol] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProtocolListResponse(BaseModel):
    """List of protocols response."""
    protocols: list[ProtocolResponse]
    total: int


class ProtocolUploadResponse(BaseModel):
    """Response after protocol upload and parsing."""
    id: UUID
    title: str
    protocol_number: Optional[str] = None
    sponsor: Optional[str] = None
    status: str = "parsed"
    extracted_data: ExtractedProtocol
    confidence_flags: list[str] = Field(default_factory=list)
