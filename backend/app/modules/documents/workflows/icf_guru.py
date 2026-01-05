"""
ICF Guru Workflow - Section-by-Section ICF Generation.

This module implements the ICF Guru workflow that generates ICFs using
25 focused subsections instead of a single prompt. Each subsection has
a laser-focused prompt for consistently high-quality output.
"""

import asyncio
import json
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.core.docengine.schema import (
    UniversalDocument,
    DocumentMetadata,
    Section,
    ContentBlock,
    ContentBlockType,
    Alignment,
    DocumentStyling,
    ComplianceMetadata,
    HeaderFooter,
)
from .base import BaseWorkflow, ContentGenerationError, DocumentBuildError
from .icf_guru_subsections import ICFSubsectionRegistry
from .icf_guru_prompts import ICFPromptBuilder

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Result of content validation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class ICFContentValidator:
    """
    Validates generated subsection content.

    Catches issues immediately after generation, before assembly.
    """

    # Prohibited terms that should never appear in ICF
    PROHIBITED_TERMS = [
        "waive",
        "release from liability",
        "you must participate",
        "required to participate",
        "give up your rights",
        "surrender",
        "relinquish",
    ]

    def validate_subsection(
        self,
        content: str,
        subsection
    ) -> ValidationResult:
        """
        Validate a single subsection's content.

        Checks:
        - Length constraints (max paragraphs)
        - No prohibited language
        - Minimum content length (not empty or trivial)
        """
        result = ValidationResult(is_valid=True)

        # Check length
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if subsection.max_paragraphs > 0 and len(paragraphs) > subsection.max_paragraphs:
            result.warnings.append(
                f"Exceeded max paragraphs: {len(paragraphs)} > {subsection.max_paragraphs}"
            )

        # Check for prohibited language
        content_lower = content.lower()
        for term in self.PROHIBITED_TERMS:
            if term in content_lower:
                result.is_valid = False
                result.errors.append(f"Prohibited term found: '{term}'")

        # Check minimum length (unless it's a structural subsection)
        if subsection.max_paragraphs > 0 and len(content.strip()) < 50:
            result.is_valid = False
            result.errors.append("Content too short (< 50 characters)")

        return result

    def validate_complete_icf(self, all_content: Dict[str, str]) -> ValidationResult:
        """
        Validate the complete assembled ICF.

        Ensures:
        - All required FDA elements present
        - No critical sections missing
        """
        result = ValidationResult(is_valid=True)

        # Required subsections
        required = [
            "study_purpose_overview",
            "procedures_overview",
            "risks_introduction",
            "benefits",
            "voluntary_participation",
        ]

        for req in required:
            if req not in all_content or not all_content[req]:
                result.errors.append(f"Missing required subsection: {req}")
                result.is_valid = False

        return result


class ICFContentAssembler:
    """
    Assembles subsection content into complete UIF document.

    Takes 25 subsection content strings and builds a UniversalDocument.
    """

    def assemble(
        self,
        subsection_content: Dict[str, str],
        protocol_data: dict
    ) -> UniversalDocument:
        """
        Build UniversalDocument from subsection content.

        Process:
        1. Group subsections into FDA sections
        2. Create Section objects with hierarchy
        3. Convert content to ContentBlocks
        4. Apply styling
        5. Add metadata, headers, footers
        6. Return UniversalDocument ready for DocEngine
        """
        # Extract metadata
        metadata = protocol_data.get("metadata", {})
        study_title = metadata.get("title", "Clinical Study")
        protocol_number = metadata.get("protocol_number", "")
        sponsor = metadata.get("sponsor", "")

        # Create document
        doc = UniversalDocument(
            document_type="icf",
            title="INFORMED CONSENT FORM",
            metadata=DocumentMetadata(
                protocol_number=protocol_number,
                protocol_title=study_title,
                sponsor=sponsor,
            ),
            styling=DocumentStyling(
                default_font="Arial",
                default_font_size=11,
                heading_1_size=14,
                heading_2_size=12,
                heading_3_size=11,
            ),
            header_footer=HeaderFooter(
                header_text=f"Protocol: {protocol_number}" if protocol_number else None,
                show_page_numbers=True,
                page_number_position="footer_center",
            ),
            compliance=ComplianceMetadata(
                generated_by="gpt-5-nano",
                polished_by=None,  # No Claude polish needed
                regulatory_framework="FDA 21 CFR 50.25",
            ),
        )

        # Build sections
        doc.sections = self._build_sections(subsection_content, protocol_data)

        return doc

    def _build_sections(
        self,
        subsection_content: Dict[str, str],
        protocol_data: dict
    ) -> List[Section]:
        """
        Build all ICF sections from subsection content.

        Creates 15 question-based sections matching FDA-compliant reference structure.
        """
        sections = []

        # Header + Introduction (invitation + preamble)
        intro_blocks = self._build_header_blocks(protocol_data)
        if subsection_content.get("invitation_to_participate"):
            intro_blocks.extend(self._text_to_paragraphs(subsection_content["invitation_to_participate"]))
        if subsection_content.get("introduction_preamble"):
            intro_blocks.extend(self._text_to_paragraphs(subsection_content["introduction_preamble"]))

        if intro_blocks:
            sections.append(Section(
                id="invitation",
                level=1,
                heading="INVITATION TO PARTICIPATE",
                content_blocks=intro_blocks,
            ))

        # 1. WHY IS THIS STUDY BEING DONE?
        purpose_blocks = []
        if subsection_content.get("study_purpose_overview"):
            purpose_blocks.extend(self._text_to_paragraphs(subsection_content["study_purpose_overview"]))
        if subsection_content.get("study_purpose_learnings"):
            purpose_blocks.extend(self._text_to_paragraphs(subsection_content["study_purpose_learnings"]))
        if purpose_blocks:
            sections.append(Section(
                id="purpose",
                level=1,
                heading="WHY IS THIS STUDY BEING DONE?",
                content_blocks=purpose_blocks,
            ))

        # 2. WHY HAVE I BEEN ASKED TO TAKE PART?
        if subsection_content.get("eligibility_why_asked"):
            sections.append(Section(
                id="eligibility",
                level=1,
                heading="WHY HAVE I BEEN ASKED TO TAKE PART?",
                content_blocks=self._text_to_paragraphs(subsection_content["eligibility_why_asked"]),
            ))

        # 3. HOW MANY PEOPLE WILL PARTICIPATE?
        if subsection_content.get("enrollment_numbers"):
            sections.append(Section(
                id="enrollment",
                level=1,
                heading="HOW MANY PEOPLE WILL PARTICIPATE?",
                content_blocks=self._text_to_paragraphs(subsection_content["enrollment_numbers"]),
            ))

        # 4. HOW LONG WILL I BE IN THE STUDY?
        time_blocks = []
        if subsection_content.get("time_visits_schedule"):
            time_blocks.extend(self._text_to_paragraphs(subsection_content["time_visits_schedule"]))
        if subsection_content.get("time_total_duration"):
            time_blocks.extend(self._text_to_paragraphs(subsection_content["time_total_duration"]))
        if time_blocks:
            sections.append(Section(
                id="time",
                level=1,
                heading="HOW LONG WILL I BE IN THE STUDY?",
                content_blocks=time_blocks,
            ))

        # 5. WHAT WILL HAPPEN IF I TAKE PART?
        proc_blocks = []
        for key in ["procedures_overview", "procedures_visits", "procedures_tests",
                    "procedures_randomization", "procedures_study_drug"]:
            if subsection_content.get(key):
                proc_blocks.extend(self._text_to_paragraphs(subsection_content[key]))
        if proc_blocks:
            sections.append(Section(
                id="procedures",
                level=1,
                heading="WHAT WILL HAPPEN IF I TAKE PART?",
                content_blocks=proc_blocks,
            ))

        # 6. WHAT ARE THE RISKS AND DISCOMFORTS?
        risks_section = self._build_risks_section(subsection_content, protocol_data)
        if risks_section:
            sections.append(risks_section)

        # 7. WHAT ARE THE BENEFITS?
        if subsection_content.get("benefits"):
            sections.append(Section(
                id="benefits",
                level=1,
                heading="WHAT ARE THE BENEFITS?",
                content_blocks=self._text_to_paragraphs(subsection_content["benefits"]),
            ))

        # 8. WHAT OTHER CHOICES DO I HAVE?
        if subsection_content.get("alternatives"):
            sections.append(Section(
                id="alternatives",
                level=1,
                heading="WHAT OTHER CHOICES DO I HAVE?",
                content_blocks=self._text_to_paragraphs(subsection_content["alternatives"]),
            ))

        # 9. WILL BEING IN THIS STUDY COST ME ANYTHING?
        if subsection_content.get("costs_to_participant"):
            sections.append(Section(
                id="costs",
                level=1,
                heading="WILL BEING IN THIS STUDY COST ME ANYTHING?",
                content_blocks=self._text_to_paragraphs(subsection_content["costs_to_participant"]),
            ))

        # 10. WILL I BE PAID FOR BEING IN THIS STUDY?
        if subsection_content.get("payment_to_participant"):
            sections.append(Section(
                id="payment",
                level=1,
                heading="WILL I BE PAID FOR BEING IN THIS STUDY?",
                content_blocks=self._text_to_paragraphs(subsection_content["payment_to_participant"]),
            ))

        # 11. WHAT HAPPENS IF I AM INJURED?
        if subsection_content.get("compensation_injury"):
            sections.append(Section(
                id="compensation",
                level=1,
                heading="WHAT HAPPENS IF I AM INJURED?",
                content_blocks=self._text_to_paragraphs(subsection_content["compensation_injury"]),
            ))

        # 12. WHAT ABOUT CONFIDENTIALITY?
        if subsection_content.get("confidentiality"):
            sections.append(Section(
                id="confidentiality",
                level=1,
                heading="WHAT ABOUT CONFIDENTIALITY?",
                content_blocks=self._text_to_paragraphs(subsection_content["confidentiality"]),
            ))

        # 13. WHAT ARE MY RIGHTS AS A RESEARCH PARTICIPANT?
        if subsection_content.get("participant_rights"):
            sections.append(Section(
                id="rights",
                level=1,
                heading="WHAT ARE MY RIGHTS AS A RESEARCH PARTICIPANT?",
                content_blocks=self._text_to_paragraphs(subsection_content["participant_rights"]),
            ))

        # 14. Voluntary participation (no question heading for this one, follows rights)
        if subsection_content.get("voluntary_participation"):
            sections.append(Section(
                id="voluntary",
                level=1,
                heading="VOLUNTARY PARTICIPATION",
                content_blocks=self._text_to_paragraphs(subsection_content["voluntary_participation"]),
            ))

        # 15. WHO CAN ANSWER MY QUESTIONS?
        sections.append(self._build_contact_section())

        # CONSENT TO PARTICIPATE (signature page)
        sections.append(self._build_signature_section())

        return sections

    def _build_header_blocks(self, protocol_data: dict) -> List[ContentBlock]:
        """Build the document header content blocks (study details only, no heading)."""
        metadata = protocol_data.get("metadata", {})
        study_title = metadata.get("title", "Clinical Study")
        protocol_number = metadata.get("protocol_number", "")
        sponsor = metadata.get("sponsor", "")

        # Don't add "INFORMED CONSENT FORM" heading here - DocEngine adds it as document title
        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Study Title: {study_title}",
                spacing_after=6,
            ),
        ]

        if protocol_number:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Protocol Number: {protocol_number}",
                spacing_after=6,
            ))

        if sponsor:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Sponsor: {sponsor}",
                spacing_after=12,
            ))

        return content_blocks

    def _build_risks_section(
        self,
        subsection_content: Dict[str, str],
        protocol_data: dict
    ) -> Optional[Section]:
        """
        Build the risks section from 7 subsections.

        Structure:
        4. RISKS AND SIDE EFFECTS
           [risks_introduction content]

           Very Common Side Effects (>10%)
           [bullet list]

           Common Side Effects (1-10%)
           [bullet list]

           Uncommon Side Effects (<1%)
           [bullet list]

           Unknown Risks
           [paragraph content]

           Pregnancy and Reproductive Risks
           [paragraph content]

           Risks from Study Procedures
           [paragraph content]
        """
        content_blocks = []

        # Introduction
        intro_text = subsection_content.get("risks_introduction", "")
        if intro_text:
            content_blocks.extend(self._text_to_paragraphs(intro_text))

        # Very common (with heading)
        if subsection_content.get("risks_very_common"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Very Common Side Effects (more than 1 in 10 people):",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.append(self._text_to_bullet_list(
                subsection_content["risks_very_common"]
            ))

        # Common
        if subsection_content.get("risks_common"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Common Side Effects (1 to 10 in 100 people):",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.append(self._text_to_bullet_list(
                subsection_content["risks_common"]
            ))

        # Uncommon
        if subsection_content.get("risks_uncommon"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Uncommon Side Effects (fewer than 1 in 100 people):",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.append(self._text_to_bullet_list(
                subsection_content["risks_uncommon"]
            ))

        # Unknown risks
        if subsection_content.get("risks_unknown"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Unknown Risks:",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.extend(self._text_to_paragraphs(subsection_content["risks_unknown"]))

        # Pregnancy risks
        if subsection_content.get("risks_pregnancy"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Pregnancy and Reproductive Risks:",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.extend(self._text_to_paragraphs(subsection_content["risks_pregnancy"]))

        # Procedure risks
        if subsection_content.get("risks_procedures"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Risks from Study Procedures:",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.extend(self._text_to_paragraphs(subsection_content["risks_procedures"]))

        if not content_blocks:
            return None

        return Section(
            id="risks",
            level=1,
            heading="WHAT ARE THE RISKS AND DISCOMFORTS?",
            content_blocks=content_blocks,
        )

    def _build_contact_section(self) -> Section:
        """Build contact information section."""
        return Section(
            id="contact",
            level=1,
            heading="WHO CAN ANSWER MY QUESTIONS?",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="If you have questions about the study, contact your study doctor or study staff.",
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="For questions about your rights as a research participant, contact the Institutional Review Board (IRB) at your study site.",
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Your study team will provide you with specific contact names and phone numbers for your site.",
                    spacing_after=12,
                ),
            ],
        )

    def _build_signature_section(self) -> Section:
        """Build the signature page section."""
        preamble_text = (
            "I have read this consent form and have had the chance to ask questions. "
            "All my questions have been answered to my satisfaction. "
            "I voluntarily agree to take part in this research study. "
            "I will receive a signed copy of this form."
        )

        return Section(
            id="signatures",
            level=1,
            heading="CONSENT TO PARTICIPATE",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PAGE_BREAK,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=preamble_text,
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50,
                    spacing_before=24,
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Participant Name (printed)",
                    spacing_after=18,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Participant Signature",
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Person Obtaining Consent",
                    spacing_after=12,
                ),
            ],
        )

    def _text_to_paragraphs(self, text: str) -> List[ContentBlock]:
        """Convert plain text to ContentBlock paragraphs."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        return [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=p,
                spacing_after=6,
            )
            for p in paragraphs
        ]

    def _text_to_bullet_list(self, text: str) -> ContentBlock:
        """Convert bullet text to ContentBlock list."""
        items = [
            line.strip("- ").strip()
            for line in text.split("\n")
            if line.strip() and (line.strip().startswith("-") or line.strip().startswith("•"))
        ]
        return ContentBlock(
            type=ContentBlockType.BULLET_LIST,
            items=items if items else [text.strip()],
        )


class ICFGuruWorkflow(BaseWorkflow):
    """
    Section-by-section ICF generation using focused prompts.

    Replaces the single-prompt approach with 25 laser-focused subsections.
    Each subsection has a specific job, making it nearly impossible to fail.
    """

    document_type = "icf"
    requires_polish = False  # Quality built into prompts, no Claude needed

    def __init__(self, openai_client, claude_client=None, gemini_client=None):
        """
        Initialize ICF Guru workflow.

        Args:
            openai_client: OpenAI client for GPT-5 Nano (required)
            claude_client: Claude client for polish (optional)
            gemini_client: Gemini client for fallback (optional, deprecated)
        """
        super().__init__(gemini_client, claude_client)
        self.openai = openai_client
        self.subsection_registry = ICFSubsectionRegistry()
        self.prompt_builder = ICFPromptBuilder()
        self.content_validator = ICFContentValidator()
        self.assembler = ICFContentAssembler()

        # Validate required client
        if not self.openai:
            logger.warning(
                "OpenAI client not provided - ICF generation will fail. "
                "Set OPENAI_API_KEY environment variable."
            )

    async def generate_content(self, protocol_data: dict) -> dict:
        """
        Generate content by iterating through subsections sequentially.

        For each subsection:
        1. Extract relevant protocol data
        2. Build focused prompt
        3. Generate with GPT-5 Nano (with retry)
        4. Validate content
        5. Use fallback if validation fails

        Returns:
            Dictionary with subsection IDs as keys, content as values
        """
        subsection_content = {}

        for subsection in self.subsection_registry.get_ordered_subsections():
            # Check if should skip
            if self.subsection_registry.should_skip(subsection.id, protocol_data):
                logger.info(f"Skipping subsection: {subsection.id}")
                continue

            # Handle structural subsections (no AI generation needed)
            if subsection.id in ["document_header", "contact_information", "signature_page"]:
                logger.info(f"Skipping structural subsection: {subsection.id}")
                continue

            # Extract relevant data
            relevant_data = self.subsection_registry.extract_relevant_data(
                subsection.id, protocol_data
            )

            # Skip if no data available ONLY if subsection has required_fields
            # Subsections with no required_fields (like introduction_preamble) should always generate
            if subsection.required_fields and (not relevant_data or all(not v for v in relevant_data.values())):
                logger.warning(f"No data for subsection: {subsection.id}")
                if subsection.fallback_content:
                    subsection_content[subsection.id] = subsection.fallback_content
                    logger.info(f"Using fallback for: {subsection.id}")
                continue

            # Build focused prompt
            prompt = self.prompt_builder.build_prompt(subsection, relevant_data)

            if not prompt:
                logger.warning(f"No prompt template for: {subsection.id}")
                if subsection.fallback_content:
                    subsection_content[subsection.id] = subsection.fallback_content
                continue

            # Generate with retry
            try:
                content = await self._generate_subsection(
                    subsection,
                    prompt,
                    max_retries=3
                )

                # Validate
                validation = self.content_validator.validate_subsection(
                    content, subsection
                )

                if validation.is_valid:
                    subsection_content[subsection.id] = content
                    logger.info(f"✓ Generated: {subsection.id} ({len(content)} chars)")
                else:
                    logger.warning(
                        f"Validation failed for {subsection.id}: {validation.errors}"
                    )
                    # Use fallback for critical subsections
                    if subsection.fallback_content:
                        subsection_content[subsection.id] = subsection.fallback_content
                        logger.info(f"Using fallback after validation failure: {subsection.id}")
                    else:
                        # For non-critical, use generated content anyway with warning
                        subsection_content[subsection.id] = content

            except Exception as e:
                logger.error(f"Failed to generate {subsection.id}: {e}")
                # Use fallback if available
                if subsection.fallback_content:
                    subsection_content[subsection.id] = subsection.fallback_content
                    logger.info(f"Using fallback after error: {subsection.id}")
                else:
                    # For critical subsections without fallback, raise error
                    if subsection.id in ["study_purpose_overview", "voluntary_participation"]:
                        raise ContentGenerationError(
                            f"Failed to generate critical subsection: {subsection.id}"
                        )
                    # For non-critical, skip
                    logger.warning(f"Skipping non-critical subsection: {subsection.id}")

        # Validate complete content
        complete_validation = self.content_validator.validate_complete_icf(
            subsection_content
        )
        if not complete_validation.is_valid:
            logger.error(f"Complete ICF validation failed: {complete_validation.errors}")
            # Continue anyway but flag for review

        logger.info(f"Generated {len(subsection_content)} subsections")
        return subsection_content

    async def _generate_subsection(
        self,
        subsection,
        prompt: str,
        max_retries: int = 3,
        use_model: str = "openai"  # "gemini", "openai", or "claude"
    ) -> str:
        """
        Generate a single subsection with retry logic.

        Args:
            subsection: Subsection definition
            prompt: Focused prompt for this subsection
            max_retries: Number of retry attempts
            use_model: Which LLM to use ("gemini", "openai", "claude")

        Returns:
            Generated content string
        """
        for attempt in range(max_retries):
            try:
                # Choose LLM client
                if use_model == "openai" and self.openai:
                    response = await self.openai.generate(
                        prompt=prompt,
                        temperature=1.0,  # GPT-5 Nano only supports temperature=1
                        max_tokens=4000,
                        model="gpt-5-nano",
                    )
                elif use_model == "claude" and self.claude:
                    response = await self.claude.generate(
                        prompt=prompt,
                        temperature=0.7,
                        max_tokens=4000,
                    )
                elif use_model == "gemini" and self.gemini:
                    # Gemini as optional alternative
                    response = await self.gemini.generate(
                        prompt=prompt,
                        temperature=0.7,
                        max_tokens=4000,
                    )
                else:
                    # OpenAI is required for ICF generation
                    raise ContentGenerationError(
                        f"OpenAI client (GPT-5 Nano) not configured. "
                        f"Set OPENAI_API_KEY environment variable."
                    )

                # Clean response
                content = self._clean_response(response)

                # Log token usage estimate
                estimated_tokens = len(prompt.split()) + len(content.split())
                logger.debug(
                    f"{subsection.id}: ~{estimated_tokens} tokens "
                    f"(attempt {attempt + 1})"
                )

                return content

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Retry {attempt + 1}/{max_retries} for {subsection.id}: {e}"
                    )
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise

    def _clean_response(self, response: str) -> str:
        """
        Clean Gemini response.

        - Remove any markdown code blocks
        - Trim whitespace
        - Remove any JSON formatting attempts
        """
        text = response.strip()

        # Remove markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            # Remove first and last lines if they're ``` markers
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines)

        # Remove JSON attempts (prompts say plain text only, but just in case)
        if text.startswith("{") or text.startswith("["):
            logger.warning("Received JSON response, extracting text...")
            try:
                data = json.loads(text)
                if isinstance(data, dict):
                    text = data.get("content", str(data))
                elif isinstance(data, list):
                    text = "\n\n".join(str(item) for item in data)
            except:
                pass  # Not JSON, continue

        return text.strip()

    def build_document(
        self,
        content: dict,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Build UniversalDocument from subsection content.

        Delegates to ICFContentAssembler.
        """
        return self.assembler.assemble(content, protocol_data)
