"""
ICF Guru Subsection Definitions.

This module defines the 25 focused subsections for ICF generation.
Each subsection has a single, clear purpose and generates 2-5 paragraphs maximum.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class SubsectionDefinition:
    """
    Definition of a single ICF subsection.

    Each subsection is a small, focused piece of the ICF with:
    - Clear data requirements
    - Validation rules
    - Fallback content for failures
    """
    id: str
    title: str
    parent_section: str
    order: int
    required_fields: List[str] = field(default_factory=list)
    validation_rules: Dict[str, Any] = field(default_factory=dict)
    max_paragraphs: int = 5
    fallback_content: Optional[str] = None
    skip_conditions: Optional[Dict[str, Any]] = None


class ICFSubsectionRegistry:
    """
    Central registry of all 25 ICF subsections.

    Responsibilities:
    - Define all subsections with metadata
    - Extract relevant protocol data per subsection
    - Determine subsection order
    - Handle skip conditions
    """

    def __init__(self):
        self.subsections = self._init_subsections()

    def _init_subsections(self) -> Dict[str, SubsectionDefinition]:
        """
        Initialize all 25 subsection definitions.

        This is the heart of the taxonomy - each subsection precisely defined.
        """
        return {
            # Structural Subsections (4)
            "document_header": SubsectionDefinition(
                id="document_header",
                title="Document Header",
                parent_section="header",
                order=1,
                required_fields=["metadata.title", "metadata.protocol_number", "metadata.sponsor"],
                max_paragraphs=0,  # Not text content, just data display
                fallback_content=None,
            ),

            "invitation_to_participate": SubsectionDefinition(
                id="invitation_to_participate",
                title="Invitation to Participate",
                parent_section="introduction",
                order=1.5,
                required_fields=["metadata.title", "investigational_product.name"],
                max_paragraphs=2,
                fallback_content=(
                    "You are invited to take part in a research study. "
                    "Before you decide whether to participate, please read this form carefully. "
                    "Ask questions about anything you do not understand."
                ),
            ),

            "introduction_preamble": SubsectionDefinition(
                id="introduction_preamble",
                title="Introduction",
                parent_section="introduction",
                order=2,
                required_fields=[],
                max_paragraphs=2,
                fallback_content=(
                    "You are being asked to take part in a research study. "
                    "This form gives you important information about the study. "
                    "Please read it carefully and take your time. "
                    "Ask your study doctor or study staff to explain anything you do not understand. "
                    "You can ask questions at any time. Taking part in this study is your choice."
                ),
            ),

            "contact_information": SubsectionDefinition(
                id="contact_information",
                title="Contact Information",
                parent_section="contact",
                order=23,
                required_fields=[],
                max_paragraphs=0,  # Template with placeholders
                fallback_content=None,
            ),

            "signature_page": SubsectionDefinition(
                id="signature_page",
                title="Signature Page",
                parent_section="signatures",
                order=24,
                required_fields=[],
                max_paragraphs=0,  # Signature blocks
                fallback_content=None,
            ),

            # Purpose & Overview (2)
            "study_purpose_overview": SubsectionDefinition(
                id="study_purpose_overview",
                title="Study Purpose Overview",
                parent_section="purpose",
                order=3,
                required_fields=[
                    "investigational_product.name",
                    "metadata.indication",
                    "metadata.phase",
                    "design.study_type",
                ],
                max_paragraphs=3,
                fallback_content=(
                    "This research study is being done to learn about an investigational treatment "
                    "for your condition. The study will help researchers understand if the treatment "
                    "is safe and works well.\n\n"
                    "Research studies help doctors learn new ways to treat diseases. "
                    "You do not have to join this study to get treatment for your condition."
                ),
            ),

            "study_purpose_learnings": SubsectionDefinition(
                id="study_purpose_learnings",
                title="What Researchers Hope to Learn",
                parent_section="purpose",
                order=4,
                required_fields=["endpoints.primary", "design.planned_enrollment"],
                max_paragraphs=2,
                fallback_content=(
                    "The study will help researchers learn if the treatment works and is safe. "
                    "The information learned may help other people in the future."
                ),
            ),

            "eligibility_why_asked": SubsectionDefinition(
                id="eligibility_why_asked",
                title="Why Have I Been Asked to Take Part",
                parent_section="eligibility",
                order=4.5,
                required_fields=["eligibility.inclusion", "metadata.indication"],
                max_paragraphs=2,
                fallback_content=(
                    "You have been asked to participate because you meet the requirements for this study. "
                    "Your study doctor can explain why you may be eligible for this research."
                ),
            ),

            "enrollment_numbers": SubsectionDefinition(
                id="enrollment_numbers",
                title="How Many People Will Participate",
                parent_section="eligibility",
                order=4.6,
                required_fields=["design.planned_enrollment"],
                max_paragraphs=1,
                fallback_content=(
                    "This study will include people at multiple sites. "
                    "Your study doctor can tell you how many people are expected to join."
                ),
            ),

            # Study Procedures (5)
            "procedures_overview": SubsectionDefinition(
                id="procedures_overview",
                title="Procedures Overview",
                parent_section="procedures",
                order=5,
                required_fields=["design.study_type", "design.planned_enrollment"],
                max_paragraphs=2,
                fallback_content=(
                    "During this study, you will have regular visits with the study team. "
                    "At these visits, the study team will check your health and see how the treatment is working."
                ),
            ),

            "procedures_visits": SubsectionDefinition(
                id="procedures_visits",
                title="Visit Schedule",
                parent_section="procedures",
                order=6,
                required_fields=["visits", "design.study_duration_weeks"],
                max_paragraphs=3,
                fallback_content=(
                    "You will need to come to the study site for visits as scheduled by your study team. "
                    "The study team will give you a schedule of your visits."
                ),
            ),

            "procedures_tests": SubsectionDefinition(
                id="procedures_tests",
                title="Tests and Procedures",
                parent_section="procedures",
                order=7,
                required_fields=["procedures"],
                max_paragraphs=3,
                fallback_content=(
                    "At each visit, we will do some tests to check your health. "
                    "These may include blood tests, physical exams, and other tests. "
                    "The study team will explain each test before it is done."
                ),
            ),

            "procedures_randomization": SubsectionDefinition(
                id="procedures_randomization",
                title="Randomization and Blinding",
                parent_section="procedures",
                order=8,
                required_fields=["design.blinding", "design.control", "design.arms"],
                max_paragraphs=2,
                fallback_content=(
                    "You will be assigned to a treatment group by chance. "
                    "This is like flipping a coin. You will have an equal chance of being in any group."
                ),
                skip_conditions={"design.blinding": ["open", None]},
            ),

            "procedures_study_drug": SubsectionDefinition(
                id="procedures_study_drug",
                title="Study Drug Administration",
                parent_section="procedures",
                order=9,
                required_fields=[
                    "investigational_product.name",
                    "investigational_product.route",
                    "investigational_product.dose",
                    "investigational_product.frequency",
                ],
                max_paragraphs=2,
                fallback_content=(
                    "You will take the study treatment as directed by the study team. "
                    "The study team will tell you how and when to take it."
                ),
            ),

            # Time Commitment (2)
            "time_visits_schedule": SubsectionDefinition(
                id="time_visits_schedule",
                title="Visit Schedule and Time",
                parent_section="time",
                order=10,
                required_fields=["visits", "design.study_duration_weeks"],
                max_paragraphs=2,
                fallback_content=(
                    "You will need to come to the study site for several visits. "
                    "Each visit may take several hours."
                ),
            ),

            "time_total_duration": SubsectionDefinition(
                id="time_total_duration",
                title="Total Study Duration",
                parent_section="time",
                order=11,
                required_fields=["design.study_duration_weeks"],
                max_paragraphs=2,
                fallback_content=(
                    "This study will last several months. "
                    "The study team will tell you exactly how long you will be in the study."
                ),
            ),

            # Risks (7 - Most Critical Section)
            "risks_introduction": SubsectionDefinition(
                id="risks_introduction",
                title="Risks Introduction",
                parent_section="risks",
                order=12,
                required_fields=["investigational_product.name", "design.study_type"],
                max_paragraphs=2,
                fallback_content=(
                    "Like all treatments, this study treatment may cause side effects. "
                    "A side effect is something unwanted that happens during the study. "
                    "Your study doctor will watch you closely for any side effects."
                ),
            ),

            "risks_very_common": SubsectionDefinition(
                id="risks_very_common",
                title="Very Common Side Effects",
                parent_section="risks",
                order=13,
                required_fields=["adverse_events"],
                validation_rules={"frequency_filter": ">10%", "format": "bullet_list"},
                max_paragraphs=1,
                fallback_content=None,  # Skip if no data
                skip_conditions={"adverse_events_filtered": ["empty"]},
            ),

            "risks_common": SubsectionDefinition(
                id="risks_common",
                title="Common Side Effects",
                parent_section="risks",
                order=14,
                required_fields=["adverse_events"],
                validation_rules={"frequency_filter": "1-10%", "format": "bullet_list"},
                max_paragraphs=1,
                fallback_content=None,  # Skip if no data
                skip_conditions={"adverse_events_filtered": ["empty"]},
            ),

            "risks_uncommon": SubsectionDefinition(
                id="risks_uncommon",
                title="Uncommon Side Effects",
                parent_section="risks",
                order=15,
                required_fields=["adverse_events"],
                validation_rules={"frequency_filter": "<1%", "format": "bullet_list"},
                max_paragraphs=1,
                fallback_content=None,  # Skip if no data
                skip_conditions={"adverse_events_filtered": ["empty"]},
            ),

            "risks_unknown": SubsectionDefinition(
                id="risks_unknown",
                title="Unknown Risks",
                parent_section="risks",
                order=16,
                required_fields=["investigational_product.name", "metadata.phase"],
                max_paragraphs=2,
                fallback_content=(
                    "This is an investigational treatment. There may be side effects or risks "
                    "that we do not know about yet. You will be told about any new information "
                    "that might affect your decision to stay in the study."
                ),
            ),

            "risks_pregnancy": SubsectionDefinition(
                id="risks_pregnancy",
                title="Pregnancy and Reproductive Risks",
                parent_section="risks",
                order=17,
                required_fields=["eligibility.sex", "eligibility.exclusion"],
                max_paragraphs=3,
                fallback_content=(
                    "If you are a woman who could become pregnant, you must use effective birth control "
                    "during the study. Tell your study doctor right away if you become pregnant."
                ),
                skip_conditions={"eligibility.sex": ["Male"]},
            ),

            "risks_procedures": SubsectionDefinition(
                id="risks_procedures",
                title="Risks from Study Procedures",
                parent_section="risks",
                order=18,
                required_fields=["procedures"],
                max_paragraphs=2,
                fallback_content=(
                    "The study procedures may cause some discomfort. Your study doctor will explain "
                    "the risks of each procedure before it is done."
                ),
            ),

            # Simple Sections (5)
            "benefits": SubsectionDefinition(
                id="benefits",
                title="Benefits",
                parent_section="benefits",
                order=19,
                required_fields=["investigational_product.name", "metadata.indication"],
                max_paragraphs=3,
                fallback_content=(
                    "You may or may not benefit from being in this study. "
                    "We do not know if the study treatment will help you. "
                    "The information we learn from this study may help other people in the future."
                ),
            ),

            "alternatives": SubsectionDefinition(
                id="alternatives",
                title="Alternatives",
                parent_section="alternatives",
                order=20,
                required_fields=["metadata.indication"],
                max_paragraphs=2,
                fallback_content=(
                    "Instead of being in this study, you could choose standard treatment from your doctor, "
                    "treatment in a different research study, or no treatment. "
                    "Your doctor can explain these options and help you decide what is best for you."
                ),
            ),

            "costs_to_participant": SubsectionDefinition(
                id="costs_to_participant",
                title="Costs to You",
                parent_section="costs",
                order=20.5,
                required_fields=["metadata.sponsor"],
                max_paragraphs=2,
                fallback_content=(
                    "There is no cost to you for taking part in this study. "
                    "The study sponsor will pay for the study drug and study-related tests. "
                    "You will still need to pay for your regular medical care and any treatments not related to the study."
                ),
            ),

            "payment_to_participant": SubsectionDefinition(
                id="payment_to_participant",
                title="Payment for Participation",
                parent_section="payment",
                order=20.6,
                required_fields=[],
                max_paragraphs=2,
                fallback_content=(
                    "You will not be paid for taking part in this study. "
                    "However, you may receive compensation for travel expenses or time. "
                    "Your study team will provide you with details about any compensation available."
                ),
            ),

            "confidentiality": SubsectionDefinition(
                id="confidentiality",
                title="Confidentiality",
                parent_section="confidentiality",
                order=21,
                required_fields=["metadata.sponsor"],
                max_paragraphs=3,
                fallback_content=(
                    "We will keep your information private. Your name will not appear in any reports about this study. "
                    "Only people who work on this study will see your information. "
                    "We will use a code number instead of your name on study records."
                ),
            ),

            "compensation_injury": SubsectionDefinition(
                id="compensation_injury",
                title="Compensation for Injury",
                parent_section="compensation",
                order=22,
                required_fields=["metadata.sponsor"],
                max_paragraphs=3,
                fallback_content=(
                    "If you are injured as a result of being in this study, medical treatment is available. "
                    "Please contact your study doctor right away if you have any problems. "
                    "Ask your study team for more details about compensation for study-related injuries."
                ),
            ),

            "participant_rights": SubsectionDefinition(
                id="participant_rights",
                title="Your Rights as a Research Participant",
                parent_section="rights",
                order=24.5,
                required_fields=[],
                max_paragraphs=3,
                fallback_content=(
                    "As a research participant, you have rights. You have the right to ask questions at any time. "
                    "You have the right to leave the study at any time. You have the right to receive information "
                    "about the study results when they are available. You do not give up any legal rights by signing this form."
                ),
            ),

            "voluntary_participation": SubsectionDefinition(
                id="voluntary_participation",
                title="Voluntary Participation",
                parent_section="voluntary",
                order=25,
                required_fields=[],
                max_paragraphs=3,
                fallback_content=(
                    "Taking part in this study is your choice. You may decide not to take part or may leave the study at any time. "
                    "Your decision will not affect your regular medical care. You will still receive the care you need. "
                    "If you decide to stop being in the study, please tell your study doctor."
                ),
            ),
        }

    def get_subsection(self, subsection_id: str) -> Optional[SubsectionDefinition]:
        """Get subsection definition by ID."""
        return self.subsections.get(subsection_id)

    def get_ordered_subsections(self) -> List[SubsectionDefinition]:
        """Get subsections in rendering order (1-25)."""
        return sorted(self.subsections.values(), key=lambda s: s.order)

    def extract_relevant_data(
        self,
        subsection_id: str,
        protocol_data: dict
    ) -> dict:
        """
        Extract ONLY the protocol data fields needed for this subsection.

        Critical for focused prompts - don't overwhelm with entire protocol.

        Args:
            subsection_id: Subsection ID
            protocol_data: Full protocol data dictionary

        Returns:
            Dictionary with only required fields for this subsection
        """
        subsection = self.subsections.get(subsection_id)
        if not subsection:
            return {}

        relevant = {}

        for field_path in subsection.required_fields:
            value = self._get_nested_value(protocol_data, field_path)
            if value is not None:
                # Use the last part of the path as the key
                key = field_path.split(".")[-1]
                relevant[key] = value

        # Special processing for adverse_events (frequency filtering)
        if "adverse_events" in relevant and subsection.validation_rules.get("frequency_filter"):
            relevant["adverse_events"] = self._filter_adverse_events(
                relevant["adverse_events"],
                subsection.validation_rules["frequency_filter"]
            )

        return relevant

    def should_skip(self, subsection_id: str, protocol_data: dict) -> bool:
        """
        Determine if subsection should be skipped based on protocol data.

        Example: Skip "risks_pregnancy" if study is male-only

        Args:
            subsection_id: Subsection ID
            protocol_data: Protocol data dictionary

        Returns:
            True if subsection should be skipped
        """
        subsection = self.subsections.get(subsection_id)
        if not subsection or not subsection.skip_conditions:
            return False

        for field_path, skip_values in subsection.skip_conditions.items():
            value = self._get_nested_value(protocol_data, field_path)
            if value in skip_values:
                logger.info(f"Skipping {subsection_id}: {field_path}={value}")
                return True

        return False

    def _get_nested_value(self, data: dict, path: str) -> Any:
        """
        Get nested value from dictionary using dot-notation path.

        Example: "metadata.protocol_number" -> data["metadata"]["protocol_number"]

        Args:
            data: Dictionary to search
            path: Dot-notation path

        Returns:
            Value at path or None if not found
        """
        keys = path.split(".")
        value = data

        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
                if value is None:
                    return None
            else:
                return None

        return value

    def _filter_adverse_events(
        self,
        adverse_events: List[dict],
        frequency_filter: str
    ) -> List[dict]:
        """
        Filter adverse events by frequency.

        Args:
            adverse_events: List of adverse event dictionaries
            frequency_filter: Filter string (">10%", "1-10%", "<1%")

        Returns:
            Filtered list of adverse events
        """
        if not adverse_events:
            return []

        filtered = []

        for ae in adverse_events:
            freq = (ae.get("frequency", "") or "").lower()

            if frequency_filter == ">10%":
                # Very common
                if "very common" in freq or ">10%" in freq or any(
                    f"{p}%" in freq for p in range(11, 101)
                ):
                    filtered.append(ae)

            elif frequency_filter == "1-10%":
                # Common
                if ("common" in freq and "very" not in freq) or "1-10%" in freq:
                    filtered.append(ae)

            elif frequency_filter == "<1%":
                # Uncommon
                if "uncommon" in freq or "<1%" in freq or "0." in freq:
                    filtered.append(ae)

        return filtered
