"""
DEPRECATED: Legacy ICF workflow using single-prompt approach.

This workflow has been replaced by ICFGuruWorkflow (icf_guru.py) which uses
25 focused subsections for higher quality and consistency.

Kept for reference only. DO NOT USE.

---

Original description:
ICF (Informed Consent Form) workflow for document generation.

This workflow generates FDA 21 CFR 50.25 compliant Informed Consent Forms
from protocol data using AI. Content is written at 6-8th grade reading level
with plain language throughout.
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.docengine.schema import (
    UniversalDocument,
    DocumentMetadata,
    Section,
    ContentBlock,
    ContentBlockType,
    TableBlock,
    SignatureBlock,
    SignatureLine,
    InlineFormatting,
    InlineFormat,
    Alignment,
    ListStyle,
    ComplianceMetadata,
    HeaderFooter,
    DocumentStyling,
)
from app.modules.ai.prompts.icf_generation import ICF_GENERATION_PROMPT, ICF_POLISH_PROMPT
from .base import BaseWorkflow, ContentGenerationError

logger = logging.getLogger(__name__)


class ICFWorkflow(BaseWorkflow):
    """
    Workflow for generating Informed Consent Forms.

    Generates an ICF document that includes:
    - Purpose of Study
    - Study Procedures
    - Time Commitment
    - Risks and Discomforts (organized by frequency)
    - Benefits
    - Alternatives
    - Confidentiality
    - Compensation for Injury
    - Voluntary Participation
    - Contact Information
    - Signature blocks

    The generated content follows FDA 21 CFR 50.25 requirements and
    uses plain language at 6-8th grade reading level.
    """

    document_type = "icf"
    requires_polish = True

    # Plain language substitutions for medical terms
    PLAIN_LANGUAGE_MAP = {
        "adverse event": "side effect",
        "randomized": "assigned by chance",
        "placebo": "inactive substance",
        "double-blind": "neither you nor your doctor knows",
        "intravenous": "through a vein",
        "subcutaneous": "under the skin",
        "intramuscular": "into the muscle",
        "oral": "by mouth",
        "efficacy": "effectiveness",
        "indication": "condition",
        "contraindication": "reason not to take",
        "pharmacokinetics": "how the drug moves through your body",
        "pharmacodynamics": "how the drug affects your body",
        "biomarker": "blood marker",
        "endpoint": "measure of success",
        "protocol": "study plan",
        "investigator": "study doctor",
    }

    async def generate_content(self, protocol_data: dict) -> dict:
        """
        Generate ICF content using Gemini AI.

        Args:
            protocol_data: Extracted protocol data from parsing

        Returns:
            Dictionary containing all ICF section content

        Raises:
            ContentGenerationError: If content generation fails
        """
        if not self.gemini:
            logger.warning("Gemini client not available, using fallback content")
            return self._generate_fallback_content(protocol_data)

        # Format the prompt with protocol data
        prompt = ICF_GENERATION_PROMPT.format(
            protocol_data=json.dumps(protocol_data, indent=2, default=str)
        )

        try:
            response = await self.gemini.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=8000,
            )

            content = self._parse_json_response(response)
            logger.debug(f"Generated ICF content with {len(content)} sections")

            # Validate required sections
            required_sections = [
                "study_purpose",
                "procedures_section",
                "risks_section",
                "benefits_section",
                "voluntary_section",
            ]
            missing = [s for s in required_sections if not content.get(s)]
            if missing:
                logger.warning(f"Missing ICF sections from AI: {missing}")
                # Fill in missing sections with fallback
                fallback = self._generate_fallback_content(protocol_data)
                for section in missing:
                    content[section] = fallback.get(section, "")

            return content

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse ICF content JSON: {e}")
            return self._generate_fallback_content(protocol_data)
        except Exception as e:
            logger.error(f"ICF content generation failed: {e}")
            raise ContentGenerationError(f"Failed to generate ICF content: {e}") from e

    async def polish_content(self, content: dict) -> dict:
        """
        Polish ICF content using Claude for 6-8th grade reading level.

        Args:
            content: Generated ICF content dictionary

        Returns:
            Polished content dictionary
        """
        if not self.claude:
            return content

        try:
            prompt = ICF_POLISH_PROMPT.format(
                content=json.dumps(content, indent=2)
            )

            response = await self.claude.generate(
                prompt=prompt,
                system="You are an expert regulatory medical writer specializing in Informed Consent Forms. Polish the content for 6-8th grade reading level.",
                temperature=0.2,
                max_tokens=8000,
            )

            polished = self._parse_json_response(response)
            logger.debug("ICF content polished successfully")
            return polished

        except Exception as e:
            logger.warning(f"ICF polish failed, using original content: {e}")
            return content

    def build_document(
        self,
        content: dict,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Build UniversalDocument from ICF content.

        Args:
            content: AI-generated ICF content
            protocol_data: Original protocol data
            user_id: User ID for metadata

        Returns:
            UniversalDocument in UIF format
        """
        # Extract metadata
        study_title = self._get_metadata_value(protocol_data, "title", "Clinical Study")
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "")
        sponsor = self._get_metadata_value(protocol_data, "sponsor", "")
        phase = self._get_metadata_value(protocol_data, "phase", "")

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
                generated_by="gemini",
                polished_by="claude" if self.requires_polish and self.claude else None,
                regulatory_framework="FDA 21 CFR 50.25",
            ),
        )

        # Build sections
        doc.sections = self._build_sections(content, protocol_data)

        return doc

    def _build_sections(
        self,
        content: dict,
        protocol_data: dict,
    ) -> List[Section]:
        """
        Build all ICF sections from content.

        Args:
            content: AI-generated content dictionary
            protocol_data: Original protocol data

        Returns:
            List of Section objects
        """
        sections = []

        # Header section with study info
        sections.append(self._build_header_section(protocol_data))

        # Introduction section
        sections.append(self._build_introduction_section())

        # Main content sections
        section_configs = [
            ("purpose", "1. PURPOSE OF THE STUDY", content.get("study_purpose", "")),
            ("procedures", "2. STUDY PROCEDURES", content.get("procedures_section", "")),
            ("time", "3. TIME COMMITMENT", content.get("time_commitment", "")),
            ("risks", "4. RISKS AND SIDE EFFECTS", None),  # Special handling
            ("benefits", "5. BENEFITS", content.get("benefits_section", "")),
            ("alternatives", "6. ALTERNATIVES", content.get("alternatives_section", "")),
            ("confidentiality", "7. CONFIDENTIALITY", content.get("confidentiality_section", "")),
            ("compensation", "8. COMPENSATION FOR INJURY", content.get("compensation_section", "")),
            ("voluntary", "9. VOLUNTARY PARTICIPATION", content.get("voluntary_section", "")),
        ]

        section_number = 0
        for section_id, heading, text in section_configs:
            section_number += 1

            if section_id == "risks":
                # Build risks section with adverse events organized by frequency
                sections.append(self._build_risks_section(
                    content,
                    protocol_data,
                    heading,
                ))
            else:
                sections.append(self._build_text_section(
                    section_id=section_id,
                    heading=heading,
                    text=text or "",
                ))

        # Contact section
        sections.append(self._build_contact_section())

        # Signature section (new page)
        sections.append(self._build_signature_section())

        return sections

    def _build_header_section(self, protocol_data: dict) -> Section:
        """Build the document header section with study info."""
        study_title = self._get_metadata_value(protocol_data, "title", "Clinical Study")
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "")
        sponsor = self._get_metadata_value(protocol_data, "sponsor", "")

        section = Section(
            id="header",
            level=1,
            heading="Document Header",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.HEADING,
                    content="INFORMED CONSENT FORM",
                    level=1,
                    alignment=Alignment.CENTER,
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Study Title: {study_title}",
                    spacing_after=6,
                ),
            ],
        )

        if protocol_number:
            section.content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Protocol Number: {protocol_number}",
                spacing_after=6,
            ))

        if sponsor:
            section.content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Sponsor: {sponsor}",
                spacing_after=12,
            ))

        return section

    def _build_introduction_section(self) -> Section:
        """Build the introduction section."""
        intro_text = (
            "You are being asked to take part in a research study. "
            "This form gives you important information about the study. "
            "Please read it carefully and take your time. "
            "Ask your study doctor or study staff to explain anything you do not understand. "
            "You can ask questions at any time. "
            "Taking part in this study is your choice."
        )

        return Section(
            id="introduction",
            level=1,
            heading="Introduction",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=intro_text,
                    spacing_before=6,
                    spacing_after=12,
                ),
            ],
        )

    def _build_text_section(
        self,
        section_id: str,
        heading: str,
        text: str,
    ) -> Section:
        """
        Build a standard text section.

        Args:
            section_id: Unique section identifier
            heading: Section heading
            text: Section text content

        Returns:
            Section object
        """
        # Split text into paragraphs
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

        content_blocks = []
        for paragraph in paragraphs:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=paragraph,
                spacing_after=6,
            ))

        return Section(
            id=section_id,
            level=1,
            heading=heading,
            content_blocks=content_blocks,
        )

    def _build_risks_section(
        self,
        content: dict,
        protocol_data: dict,
        heading: str,
    ) -> Section:
        """
        Build the risks section with adverse events organized by frequency.

        Args:
            content: AI-generated content
            protocol_data: Protocol data with adverse events
            heading: Section heading

        Returns:
            Section with risks content
        """
        risks_text = content.get("risks_section", "")
        adverse_events = protocol_data.get("adverse_events", [])

        content_blocks = []

        # Add main risks text
        if risks_text:
            for paragraph in risks_text.split("\n\n"):
                if paragraph.strip():
                    content_blocks.append(ContentBlock(
                        type=ContentBlockType.PARAGRAPH,
                        content=paragraph.strip(),
                        spacing_after=6,
                    ))

        # Organize adverse events by frequency
        ae_by_frequency = self._organize_adverse_events(adverse_events)

        # Add frequency-organized lists
        frequency_labels = [
            ("very_common", "Very Common (more than 1 in 10 people):"),
            ("common", "Common (1 to 10 in 100 people):"),
            ("uncommon", "Uncommon (less than 1 in 100 people):"),
            ("rare", "Rare:"),
        ]

        for freq_key, freq_label in frequency_labels:
            events = ae_by_frequency.get(freq_key, [])
            if events:
                # Add frequency heading
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.HEADING,
                    content=freq_label,
                    level=3,
                    spacing_before=12,
                    spacing_after=6,
                ))

                # Add bullet list of events
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.BULLET_LIST,
                    items=events,
                ))

        # Handle unknown frequency events
        unknown_events = ae_by_frequency.get("unknown", [])
        if unknown_events:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="Other possible side effects:",
                level=3,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.append(ContentBlock(
                type=ContentBlockType.BULLET_LIST,
                items=unknown_events,
            ))

        return Section(
            id="risks",
            level=1,
            heading=heading,
            content_blocks=content_blocks,
        )

    def _organize_adverse_events(self, adverse_events: list) -> Dict[str, List[str]]:
        """
        Organize adverse events by frequency category.

        Args:
            adverse_events: List of adverse event dictionaries

        Returns:
            Dictionary with frequency categories as keys and event lists as values
        """
        organized = {
            "very_common": [],
            "common": [],
            "uncommon": [],
            "rare": [],
            "unknown": [],
        }

        for ae in adverse_events:
            if not isinstance(ae, dict):
                continue

            # Use plain language version if available
            term = ae.get("plain_language") or ae.get("term", "")
            if not term:
                continue

            # Determine frequency category
            freq = (ae.get("frequency", "") or "").lower()

            if "very common" in freq or ">10%" in freq or "10%" in freq:
                organized["very_common"].append(term)
            elif "common" in freq or "1-10%" in freq or "1%-10%" in freq:
                organized["common"].append(term)
            elif "uncommon" in freq or "<1%" in freq or "0.1%-1%" in freq:
                organized["uncommon"].append(term)
            elif "rare" in freq or "<0.1%" in freq:
                organized["rare"].append(term)
            else:
                organized["unknown"].append(term)

        return organized

    def _build_contact_section(self) -> Section:
        """Build the contact information section with placeholders."""
        return Section(
            id="contact",
            level=1,
            heading="10. CONTACT INFORMATION",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="If you have questions about the study, contact:",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Principal Investigator: {{pi_name}}",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Phone: {{pi_phone}}",
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="For questions about your rights as a research participant, contact:",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Institutional Review Board: {{irb_name}}",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Phone: {{irb_phone}}",
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="For medical emergencies related to this study, contact:",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="{{emergency_contact}}",
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
            heading="SIGNATURE PAGE",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PAGE_BREAK,
                ),
                ContentBlock(
                    type=ContentBlockType.HEADING,
                    content="SIGNATURE PAGE",
                    level=1,
                    alignment=Alignment.CENTER,
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=preamble_text,
                    spacing_after=24,
                ),
                # Participant signature
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
                # Person obtaining consent
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Person Obtaining Consent",
                    spacing_after=24,
                ),
                # Optional LAR signature section
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="If applicable (for participants who cannot consent for themselves):",
                    formatting=InlineFormatting(ranges=[
                        InlineFormat(start=0, end=13, italic=True),
                    ]),
                    spacing_before=24,
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Legally Authorized Representative Signature",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50,
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Relationship to Participant",
                    spacing_after=12,
                ),
            ],
        )

    def _generate_fallback_content(self, protocol_data: dict) -> dict:
        """
        Generate fallback ICF content without AI.

        Used when Gemini is unavailable or fails.

        Args:
            protocol_data: Protocol data dictionary

        Returns:
            Dictionary of fallback ICF content
        """
        ip_name = self._get_ip_value(protocol_data, "name", "an investigational treatment")
        indication = self._get_metadata_value(protocol_data, "indication", "your condition")
        duration = self._get_design_value(protocol_data, "study_duration_weeks", "several")

        return {
            "study_purpose": (
                f"This research study is being done to learn about {ip_name} "
                f"for {indication}. The study will help researchers understand "
                "if the treatment is safe and works well.\n\n"
                "Research studies help doctors learn new ways to treat diseases. "
                "You do not have to join this study to get treatment for your condition."
            ),
            "procedures_section": (
                "During this study, you will have regular visits with the study team. "
                "At these visits, you may have:\n\n"
                "- Physical exams to check your health\n"
                "- Blood tests\n"
                "- Questions about how you are feeling\n"
                "- Other tests to see how the treatment is working\n\n"
                "The study team will explain each test before it is done. "
                "You can ask questions at any time."
            ),
            "time_commitment": (
                f"This study will last about {duration} weeks. "
                "You will need to come to the study site for visits as scheduled by your study team.\n\n"
                "Each visit may take several hours. "
                "The study team will give you a schedule of your visits."
            ),
            "risks_section": (
                "Like all treatments, this study treatment may cause side effects. "
                "A side effect is something unwanted that happens during the study.\n\n"
                "Some side effects may be mild, like headache or tiredness. "
                "Other side effects may be more serious.\n\n"
                "Your study doctor will watch you closely for any side effects. "
                "Tell your study doctor or study nurse right away if you feel unwell or notice any changes."
            ),
            "benefits_section": (
                "You may or may not benefit from being in this study. "
                "We do not know if the study treatment will help you.\n\n"
                "The information we learn from this study may help other people in the future "
                "who have the same condition."
            ),
            "alternatives_section": (
                "Instead of being in this study, you could choose:\n\n"
                "- Standard treatment from your doctor\n"
                "- Treatment in a different research study\n"
                "- No treatment\n\n"
                "Your doctor can explain these options and help you decide what is best for you."
            ),
            "confidentiality_section": (
                "We will keep your information private. "
                "Your name will not appear in any reports about this study.\n\n"
                "Only people who work on this study will see your information. "
                "This includes the study doctors, nurses, and staff. "
                "Government agencies that oversee research may also review your records.\n\n"
                "We will use a code number instead of your name on study records. "
                "Your information will be stored securely."
            ),
            "compensation_section": (
                "If you are injured as a result of being in this study, "
                "medical treatment is available.\n\n"
                "Please contact your study doctor right away if you have any problems "
                "or think you have been injured because of the study.\n\n"
                "The costs of treating a study-related injury may be covered by the sponsor. "
                "Ask your study team for more details."
            ),
            "voluntary_section": (
                "Taking part in this study is your choice. "
                "You may decide not to take part or may leave the study at any time.\n\n"
                "Your decision will not affect your regular medical care. "
                "You will still receive the care you need.\n\n"
                "If you decide to stop being in the study, please tell your study doctor. "
                "They will talk to you about the safest way to stop."
            ),
        }
