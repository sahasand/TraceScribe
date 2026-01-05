"""
DMP (Data Management Plan) workflow for document generation.

This workflow generates comprehensive Data Management Plans that describe
data management activities, procedures, and specifications for clinical trials.
DMPs are technical documents that do NOT require plain language polish.
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
    TableCell,
    InlineFormatting,
    InlineFormat,
    Alignment,
    ListStyle,
    ComplianceMetadata,
    HeaderFooter,
    DocumentStyling,
)
from app.modules.ai.prompts.dmp_generation import DMP_GENERATION_PROMPT
from .base import BaseWorkflow, ContentGenerationError

logger = logging.getLogger(__name__)


# Default dictionary versions
DEFAULT_MEDDRA_VERSION = "26.1"
DEFAULT_WHODRUG_VERSION = "March 2024"
DEFAULT_EDC_SYSTEM = "Medidata Rave"


class DMPWorkflow(BaseWorkflow):
    """
    Workflow for generating Data Management Plans.

    Generates a DMP document that includes:
    1. Purpose and Scope
    2. Study Information
    3. Roles and Responsibilities (table)
    4. Database Design
    5. Data Entry Procedures
    6. Data Validation (Edit Checks)
    7. Medical Coding (MedDRA, WHODrug versions)
    8. Query Management
    9. SAE Reconciliation
    10. Database Lock Procedures
    11. Data Transfer
    12. Quality Control
    13. Audit Trail
    14. Archiving

    This is a technical document that does NOT require Claude polish.
    Includes tables for roles, visit schedule, and dictionary versions.
    """

    document_type = "dmp"
    requires_polish = False  # Technical document - no polish needed

    async def generate_content(self, protocol_data: dict) -> dict:
        """
        Generate DMP content using GPT-5 Nano.

        Args:
            protocol_data: Extracted protocol data from parsing

        Returns:
            Dictionary containing all DMP section content

        Raises:
            ContentGenerationError: If content generation fails
        """
        if not self.openai:
            logger.warning("OpenAI client not available, using fallback content")
            return self._generate_fallback_content(protocol_data)

        # Format the prompt with protocol data
        prompt = DMP_GENERATION_PROMPT.format(
            protocol_data=json.dumps(protocol_data, indent=2, default=str)
        )

        try:
            response = await self.openai.generate(
                prompt=prompt,
                temperature=1.0,  # GPT-5 Nano only supports temperature=1.0
                max_tokens=8000,
            )

            content = self._parse_json_response(response)
            logger.debug(f"Generated DMP content with {len(content)} sections")

            # Validate and merge with fallback for missing sections
            required_sections = [
                "purpose_and_scope",
                "study_information",
                "database_design",
                "data_entry",
                "data_validation",
                "medical_coding",
                "query_management",
                "database_lock",
            ]
            missing = [s for s in required_sections if not content.get(s)]
            if missing:
                logger.warning(f"Missing DMP sections from AI: {missing}")
                fallback = self._generate_fallback_content(protocol_data)
                for section in missing:
                    content[section] = fallback.get(section, "")

            return content

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse DMP content JSON: {e}")
            return self._generate_fallback_content(protocol_data)
        except Exception as e:
            logger.error(f"DMP content generation failed: {e}")
            raise ContentGenerationError(f"Failed to generate DMP content: {e}") from e

    def build_document(
        self,
        content: dict,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Build UniversalDocument from DMP content.

        Args:
            content: AI-generated DMP content
            protocol_data: Original protocol data
            user_id: User ID for metadata

        Returns:
            UniversalDocument in UIF format
        """
        # Extract metadata
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "")
        study_title = self._get_metadata_value(protocol_data, "title", "Clinical Study")
        sponsor = self._get_metadata_value(protocol_data, "sponsor", "")
        phase = self._get_metadata_value(protocol_data, "phase", "")

        # Create document
        doc = UniversalDocument(
            document_type="dmp",
            title="DATA MANAGEMENT PLAN",
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
                heading_4_size=11,
                line_spacing=1.15,
            ),
            header_footer=HeaderFooter(
                header_text=f"Data Management Plan - {protocol_number}" if protocol_number else "Data Management Plan",
                show_page_numbers=True,
                page_number_position="footer_right",
                include_total_pages=True,
            ),
            compliance=ComplianceMetadata(
                generated_by="gpt-5-nano",
                polished_by=None,  # DMP does not require polish
                regulatory_framework="21 CFR Part 11",
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
        Build all DMP sections from content.

        Args:
            content: AI-generated content dictionary
            protocol_data: Original protocol data

        Returns:
            List of Section objects
        """
        sections = []

        # Title page section
        sections.append(self._build_title_page(protocol_data))

        # Version history table
        sections.append(self._build_version_history())

        # Table of contents placeholder
        sections.append(self._build_toc_placeholder())

        # Main content sections with 4-level numbering
        section_configs = [
            ("1", "purpose_scope", "PURPOSE AND SCOPE", content.get("purpose_and_scope", "")),
            ("2", "study_info", "STUDY INFORMATION", content.get("study_information", "")),
            ("3", "roles", "ROLES AND RESPONSIBILITIES", None),  # Special handling with table
            ("4", "database", "DATABASE DESIGN", content.get("database_design", "")),
            ("5", "data_entry", "DATA ENTRY PROCEDURES", content.get("data_entry", "")),
            ("6", "validation", "DATA VALIDATION (EDIT CHECKS)", content.get("data_validation", "")),
            ("7", "coding", "MEDICAL CODING", None),  # Special handling with dictionary versions
            ("8", "query", "DATA REVIEW AND QUERY MANAGEMENT", content.get("query_management", "")),
            ("9", "sae", "SAE RECONCILIATION", content.get("sae_reconciliation", "")),
            ("10", "external", "EXTERNAL DATA MANAGEMENT", content.get("external_data", "")),
            ("11", "lock", "DATABASE LOCK PROCEDURES", content.get("database_lock", "")),
            ("12", "transfer", "DATA TRANSFER", content.get("data_transfer", "")),
            ("13", "qc", "QUALITY CONTROL", content.get("quality_control", "")),
            ("14", "audit", "AUDIT TRAIL", content.get("audit_trail", "")),
            ("15", "archive", "ARCHIVING", content.get("archiving", "")),
        ]

        for num, section_id, heading, text in section_configs:
            if section_id == "roles":
                sections.append(self._build_roles_section(
                    section_id=section_id,
                    section_num=num,
                    heading=heading,
                    content=content,
                ))
            elif section_id == "coding":
                sections.append(self._build_coding_section(
                    section_id=section_id,
                    section_num=num,
                    heading=heading,
                    content=content,
                ))
            else:
                sections.append(self._build_numbered_section(
                    section_id=section_id,
                    section_num=num,
                    heading=heading,
                    text=text or "",
                ))

        # Appendices
        visits = protocol_data.get("visits", [])
        if visits:
            sections.append(self._build_visit_schedule_appendix(visits))

        procedures = protocol_data.get("procedures", [])
        if procedures:
            sections.append(self._build_procedures_appendix(procedures))

        return sections

    def _build_title_page(self, protocol_data: dict) -> Section:
        """Build the document title page section."""
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "[Protocol Number]")
        study_title = self._get_metadata_value(protocol_data, "title", "[Study Title]")
        sponsor = self._get_metadata_value(protocol_data, "sponsor", "[Sponsor]")

        return Section(
            id="title_page",
            level=1,
            heading="Title Page",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.HEADING,
                    content="DATA MANAGEMENT PLAN",
                    level=1,
                    alignment=Alignment.CENTER,
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="",
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Protocol Number: {protocol_number}",
                    alignment=Alignment.CENTER,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Study Title: {study_title}",
                    alignment=Alignment.CENTER,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Sponsor: {sponsor}",
                    alignment=Alignment.CENTER,
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"EDC System: {DEFAULT_EDC_SYSTEM}",
                    alignment=Alignment.CENTER,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Document Version: 1.0",
                    alignment=Alignment.CENTER,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=f"Date: {datetime.now().strftime('%d %B %Y')}",
                    alignment=Alignment.CENTER,
                    spacing_after=24,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="CONFIDENTIAL",
                    alignment=Alignment.CENTER,
                    formatting=InlineFormatting(ranges=[
                        InlineFormat(start=0, end=12, bold=True),
                    ]),
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PAGE_BREAK,
                ),
            ],
        )

    def _build_version_history(self) -> Section:
        """Build the version history section with table."""
        return Section(
            id="version_history",
            level=1,
            heading="VERSION HISTORY",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.TABLE,
                    table=TableBlock(
                        headers=["Version", "Date", "Author", "Description of Changes"],
                        rows=[
                            ["1.0", "[Date]", "[Author]", "Initial version"],
                        ],
                        column_widths=[1.0, 1.5, 2.0, 3.0],
                        header_background="#4472C4",
                    ),
                ),
                ContentBlock(
                    type=ContentBlockType.PAGE_BREAK,
                ),
            ],
        )

    def _build_toc_placeholder(self) -> Section:
        """Build table of contents placeholder."""
        return Section(
            id="toc",
            level=1,
            heading="TABLE OF CONTENTS",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="[Table of Contents - to be generated in final document]",
                    formatting=InlineFormatting(ranges=[
                        InlineFormat(start=0, end=57, italic=True),
                    ]),
                    spacing_after=12,
                ),
                ContentBlock(
                    type=ContentBlockType.PAGE_BREAK,
                ),
            ],
        )

    def _build_numbered_section(
        self,
        section_id: str,
        section_num: str,
        heading: str,
        text: str,
    ) -> Section:
        """
        Build a numbered section with 4-level numbering format.

        Args:
            section_id: Unique section identifier
            section_num: Section number (e.g., "1", "2", "3")
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
            heading=f"{section_num}. {heading}",
            content_blocks=content_blocks,
        )

    def _build_roles_section(
        self,
        section_id: str,
        section_num: str,
        heading: str,
        content: dict,
    ) -> Section:
        """
        Build roles and responsibilities section with table.

        Args:
            section_id: Section identifier
            section_num: Section number
            heading: Section heading
            content: Generated content dictionary

        Returns:
            Section with roles table
        """
        roles_text = content.get("roles_and_responsibilities", "")

        content_blocks = []

        # Add main text if present
        if roles_text:
            for paragraph in roles_text.split("\n\n"):
                if paragraph.strip():
                    content_blocks.append(ContentBlock(
                        type=ContentBlockType.PARAGRAPH,
                        content=paragraph.strip(),
                        spacing_after=6,
                    ))

        # Add subsection heading for roles table
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content=f"{section_num}.1 Roles Table",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        # Add roles table
        content_blocks.append(ContentBlock(
            type=ContentBlockType.TABLE,
            table=TableBlock(
                headers=["Role", "Organization", "Key Responsibilities"],
                rows=[
                    ["Data Manager", "Sponsor/CRO", "Database design, edit checks, query management, database lock"],
                    ["Medical Coder", "Sponsor/CRO", "AE/MedHx coding, concomitant medication coding, dictionary management"],
                    ["Lead Biostatistician", "Sponsor/CRO", "SAP oversight, TLF review, database lock approval"],
                    ["Clinical Data Lead", "Sponsor", "Data review, study oversight, sign-off on deliverables"],
                    ["Site Data Entry Personnel", "Sites", "Data entry, query resolution, source verification"],
                    ["Clinical Monitor (CRA)", "Sponsor/CRO", "Source data verification, site monitoring"],
                ],
                column_widths=[2.0, 1.5, 4.0],
                header_background="#4472C4",
            ),
        ))

        # Add contact information subsection
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content=f"{section_num}.2 Contact Information",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content="Data management queries should be directed to the Data Manager. Contact information will be provided in the study-specific contact list.",
            spacing_after=6,
        ))

        return Section(
            id=section_id,
            level=1,
            heading=f"{section_num}. {heading}",
            content_blocks=content_blocks,
        )

    def _build_coding_section(
        self,
        section_id: str,
        section_num: str,
        heading: str,
        content: dict,
    ) -> Section:
        """
        Build medical coding section with dictionary versions table.

        Args:
            section_id: Section identifier
            section_num: Section number
            heading: Section heading
            content: Generated content dictionary

        Returns:
            Section with coding information
        """
        coding_text = content.get("medical_coding", "")

        content_blocks = []

        # Add main text if present
        if coding_text:
            for paragraph in coding_text.split("\n\n"):
                if paragraph.strip():
                    content_blocks.append(ContentBlock(
                        type=ContentBlockType.PARAGRAPH,
                        content=paragraph.strip(),
                        spacing_after=6,
                    ))
        else:
            # Default content
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=(
                    "Medical coding will be performed for adverse events, medical history, "
                    "and concomitant medications using industry-standard dictionaries. "
                    "Coding will be performed by qualified medical coders according to "
                    "sponsor Standard Operating Procedures (SOPs)."
                ),
                spacing_after=6,
            ))

        # Add dictionary versions subsection
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content=f"{section_num}.1 Dictionary Versions",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content="The following dictionary versions will be used for this study:",
            spacing_after=6,
        ))

        # Dictionary versions table
        content_blocks.append(ContentBlock(
            type=ContentBlockType.TABLE,
            table=TableBlock(
                headers=["Dictionary", "Version", "Application"],
                rows=[
                    ["MedDRA", DEFAULT_MEDDRA_VERSION, "Adverse Events, Medical History"],
                    ["WHODrug Global", DEFAULT_WHODRUG_VERSION, "Concomitant Medications, Prior Medications"],
                ],
                column_widths=[2.0, 1.5, 3.5],
                header_background="#4472C4",
            ),
        ))

        # Coding procedures subsection
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content=f"{section_num}.2 Coding Procedures",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Adverse events will be coded to the Lowest Level Term (LLT) in MedDRA. "
                "The System Organ Class (SOC) and Preferred Term (PT) will be used for "
                "summarization in Tables, Listings, and Figures (TLFs). "
                "Concomitant medications will be coded to the drug name level using WHODrug Global."
            ),
            spacing_after=6,
        ))

        # Dictionary upgrade handling
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content=f"{section_num}.3 Dictionary Upgrades",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Dictionary versions will be frozen at database lock. If a dictionary upgrade "
                "is required during the study, the impact will be assessed and documented. "
                "Re-coding to a new dictionary version, if performed, will be documented "
                "and include reconciliation of affected terms."
            ),
            spacing_after=6,
        ))

        return Section(
            id=section_id,
            level=1,
            heading=f"{section_num}. {heading}",
            content_blocks=content_blocks,
        )

    def _build_visit_schedule_appendix(self, visits: List[dict]) -> Section:
        """
        Build visit schedule appendix.

        Args:
            visits: List of visit dictionaries from protocol data

        Returns:
            Section with visit schedule table
        """
        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PAGE_BREAK,
            ),
        ]

        if not visits:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="Visit schedule information not available in protocol data.",
                spacing_after=6,
            ))
        else:
            # Build visit schedule table
            table_rows = []
            for visit in visits:
                visit_name = visit.get("name", "")
                timing = visit.get("timing", "")
                window = visit.get("window", "")
                procedures = ", ".join(visit.get("procedures", []))[:100]  # Truncate long lists

                table_rows.append([
                    visit_name,
                    timing,
                    window if window else "N/A",
                    procedures if procedures else "See protocol",
                ])

            content_blocks.append(ContentBlock(
                type=ContentBlockType.TABLE,
                table=TableBlock(
                    headers=["Visit", "Timing", "Window", "Key Procedures"],
                    rows=table_rows,
                    column_widths=[1.5, 1.5, 1.0, 4.0],
                    header_background="#4472C4",
                ),
            ))

        return Section(
            id="appendix_visits",
            level=1,
            heading="APPENDIX A: VISIT SCHEDULE",
            content_blocks=content_blocks,
        )

    def _build_procedures_appendix(self, procedures: List[dict]) -> Section:
        """
        Build procedures/assessments appendix.

        Args:
            procedures: List of procedure dictionaries from protocol data

        Returns:
            Section with procedures table
        """
        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PAGE_BREAK,
            ),
        ]

        if not procedures:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="Procedure information not available in protocol data.",
                spacing_after=6,
            ))
        else:
            # Build procedures table
            table_rows = []
            for proc in procedures:
                name = proc.get("name", "")
                crf_page = proc.get("crf_page", "TBD")
                collection_method = proc.get("collection_method", "eCRF")
                notes = proc.get("notes", "")

                table_rows.append([
                    name,
                    crf_page,
                    collection_method,
                    notes if notes else "-",
                ])

            content_blocks.append(ContentBlock(
                type=ContentBlockType.TABLE,
                table=TableBlock(
                    headers=["Procedure/Assessment", "CRF Page", "Collection Method", "Notes"],
                    rows=table_rows,
                    column_widths=[2.5, 1.0, 1.5, 3.0],
                    header_background="#4472C4",
                ),
            ))

        return Section(
            id="appendix_procedures",
            level=1,
            heading="APPENDIX B: CRF COMPLETION GUIDELINES",
            content_blocks=content_blocks,
        )

    def _generate_fallback_content(self, protocol_data: dict) -> dict:
        """
        Generate fallback DMP content without AI.

        Used when OpenAI is unavailable or fails.

        Args:
            protocol_data: Protocol data dictionary

        Returns:
            Dictionary of fallback DMP content
        """
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "TBD")
        study_type = self._get_design_value(protocol_data, "study_type", "clinical")
        indication = self._get_metadata_value(protocol_data, "indication", "the target indication")
        enrollment = self._get_design_value(protocol_data, "planned_enrollment", "N")

        return {
            "purpose_and_scope": (
                f"This Data Management Plan (DMP) describes the data management activities "
                f"for protocol {protocol_number}. The DMP defines the processes and procedures "
                "for data collection, entry, validation, query management, coding, and database lock.\n\n"
                "This document should be read in conjunction with the study protocol and other "
                "relevant study documentation. The DMP will be updated as necessary to reflect "
                "any changes in data management processes."
            ),
            "study_information": (
                f"This is a {study_type} study evaluating {indication}. "
                f"Approximately {enrollment} subjects are planned to be enrolled at multiple study sites.\n\n"
                "Study design details, including endpoints, visit schedule, and assessments, "
                "are provided in the protocol and will be reflected in the Case Report Form (CRF) design."
            ),
            "roles_and_responsibilities": (
                "Data management responsibilities are shared among the Sponsor, Contract Research "
                "Organization (CRO), and investigational sites. Key roles include Data Manager, "
                "Medical Coder, Biostatistician, and Site Personnel.\n\n"
                "Each role has specific responsibilities as outlined in this section and in the "
                "study-specific training materials."
            ),
            "database_design": (
                "The clinical database will be designed in the Electronic Data Capture (EDC) system "
                "based on the protocol visit schedule and assessments. Case Report Forms (CRFs) "
                "will be developed for each study visit and assessment.\n\n"
                "The database design will undergo User Acceptance Testing (UAT) prior to site activation. "
                "Any changes to the database design after UAT will follow the change control process."
            ),
            "data_entry": (
                "Data entry will be performed by trained site personnel directly into the EDC system. "
                "Double data entry is not required due to built-in edit checks and validation rules.\n\n"
                "Sites must complete data entry within the timelines specified in the study guidelines. "
                "The data entry deadline is typically within 3 business days of the visit date."
            ),
            "data_validation": (
                "Edit checks will be programmed to identify data discrepancies, out-of-range values, "
                "and protocol deviations. These checks will run at the time of data entry (real-time) "
                "and in batch mode.\n\n"
                "Edit check specifications will be documented in a separate Edit Check Specification "
                "document and tested during UAT."
            ),
            "medical_coding": (
                "Adverse events will be coded using MedDRA (Medical Dictionary for Regulatory Activities). "
                "Concomitant medications will be coded using WHODrug Global.\n\n"
                "Coding will be performed by qualified medical coders according to sponsor SOPs."
            ),
            "query_management": (
                "Data queries will be managed through the EDC system. Queries will be generated "
                "automatically based on edit checks or manually by data management review.\n\n"
                "Sites are expected to respond to queries within 5 business days. Query resolution "
                "will be tracked and reported in data management status reports."
            ),
            "sae_reconciliation": (
                "SAE (Serious Adverse Event) reconciliation between the clinical database and safety "
                "database will be performed monthly. Any discrepancies will be documented and resolved "
                "prior to database lock.\n\n"
                "The reconciliation process will follow the SAE Reconciliation Plan for this study."
            ),
            "external_data": (
                "External data (e.g., central laboratory, ECG, biomarkers) will be transferred "
                "electronically and reconciled with eCRF data. Transfer specifications will be "
                "documented in Data Transfer Agreements with each external vendor.\n\n"
                "External data will be loaded into the clinical database and subject to the same "
                "quality checks as eCRF data."
            ),
            "database_lock": (
                "Database lock will occur after all data has been entered, queries resolved, "
                "and medical coding completed. A database lock checklist will be completed "
                "prior to the lock meeting.\n\n"
                "The database lock meeting will include Data Management, Biostatistics, "
                "Clinical Operations, and Medical Monitor. Approval from all key stakeholders "
                "is required prior to database lock."
            ),
            "data_transfer": (
                "Data transfers to the Sponsor will be performed using secure file transfer protocols. "
                "Transfer specifications and schedules will be documented in a separate Data Transfer "
                "Agreement.\n\n"
                "Standard data formats (e.g., SAS, CDISC) will be used for data transfers. "
                "All transfers will be logged for audit trail purposes."
            ),
            "quality_control": (
                "Quality control reviews will be performed throughout the study to ensure data integrity. "
                "These reviews include targeted data listings, cross-form checks, and trend analyses.\n\n"
                "Quality metrics will be tracked and reported regularly to study management."
            ),
            "audit_trail": (
                "The EDC system maintains a complete audit trail of all data changes, including "
                "the date/time of change, user ID, and reason for change. This audit trail is "
                "compliant with 21 CFR Part 11 requirements.\n\n"
                "Audit trail reports will be available for review by Sponsors, regulatory authorities, "
                "and study monitors."
            ),
            "archiving": (
                "All study data and documentation will be archived according to regulatory requirements "
                "and sponsor SOPs. Electronic data will be archived in a validated, secure repository.\n\n"
                "Paper source documents and essential documents will be retained at the site as per "
                "local regulations and sponsor requirements (minimum 15 years or as required)."
            ),
        }
