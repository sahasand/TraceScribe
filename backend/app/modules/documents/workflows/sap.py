"""
SAP (Statistical Analysis Plan) workflow for document generation.

This workflow generates comprehensive Statistical Analysis Plans that describe
planned statistical analyses for clinical trials. SAPs require Claude polish
to refine statistical terminology. CRITICAL: Endpoints are copied VERBATIM
from the protocol - this is a compliance requirement.
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
from app.modules.ai.prompts.sap_generation import SAP_GENERATION_PROMPT
from .base import BaseWorkflow, ContentGenerationError

logger = logging.getLogger(__name__)


class SAPWorkflow(BaseWorkflow):
    """
    Workflow for generating Statistical Analysis Plans.

    Generates a SAP document that includes:
    1. Introduction
    2. Study Objectives and Endpoints
       - Primary Endpoints (VERBATIM from protocol)
       - Secondary Endpoints (VERBATIM from protocol)
    3. Study Design Overview
    4. Analysis Populations (ITT, mITT, PP, Safety)
    5. Statistical Methods
       - General Statistical Considerations
       - Primary Analysis
       - Secondary Analyses
       - Safety Analyses
    6. Sample Size and Power
    7. Missing Data Handling
    8. Interim Analysis (if applicable)
    9. TLF Shells (Table/Listing/Figure shells)

    CRITICAL: Endpoints are copied VERBATIM from the protocol - this is
    a regulatory compliance requirement for SAPs.

    This document DOES require Claude polish for statistical terminology.
    References ICH E9 guidelines throughout.
    """

    document_type = "sap"
    requires_polish = True  # Polish for statistical terminology

    async def generate_content(self, protocol_data: dict) -> dict:
        """
        Generate SAP content using GPT-5 Nano.

        IMPORTANT: Endpoints are extracted VERBATIM from protocol data
        and not modified by the AI.

        Args:
            protocol_data: Extracted protocol data from parsing

        Returns:
            Dictionary containing all SAP section content

        Raises:
            ContentGenerationError: If content generation fails
        """
        if not self.openai:
            logger.warning("OpenAI client not available, using fallback content")
            return self._generate_fallback_content(protocol_data)

        # Format the prompt with protocol data
        prompt = SAP_GENERATION_PROMPT.format(
            protocol_data=json.dumps(protocol_data, indent=2, default=str)
        )

        try:
            response = await self.openai.generate(
                prompt=prompt,
                temperature=1.0,  # GPT-5 Nano only supports temperature=1.0
                max_tokens=10000,
            )

            content = self._parse_json_response(response)
            logger.debug(f"Generated SAP content with {len(content)} sections")

            # CRITICAL: Ensure endpoints are VERBATIM from protocol, not AI-generated
            endpoints = protocol_data.get("endpoints", {})
            content["primary_endpoints_verbatim"] = endpoints.get("primary", [])
            content["secondary_endpoints_verbatim"] = endpoints.get("secondary", [])
            content["exploratory_endpoints_verbatim"] = endpoints.get("exploratory", [])

            # Validate required sections
            required_sections = [
                "introduction",
                "study_design_summary",
                "analysis_populations",
                "statistical_methods",
            ]
            missing = [s for s in required_sections if not content.get(s)]
            if missing:
                logger.warning(f"Missing SAP sections from AI: {missing}")
                fallback = self._generate_fallback_content(protocol_data)
                for section in missing:
                    content[section] = fallback.get(section, "")

            return content

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse SAP content JSON: {e}")
            return self._generate_fallback_content(protocol_data)
        except Exception as e:
            logger.error(f"SAP content generation failed: {e}")
            raise ContentGenerationError(f"Failed to generate SAP content: {e}") from e

    async def polish_content(self, content: dict) -> dict:
        """
        Polish SAP content using Claude for statistical terminology.

        IMPORTANT: This method preserves VERBATIM endpoints and only
        polishes other content sections.

        Args:
            content: Generated SAP content dictionary

        Returns:
            Polished content dictionary with preserved verbatim endpoints
        """
        if not self.claude:
            return content

        # Extract verbatim endpoints before polishing - these MUST NOT be modified
        verbatim_primary = content.get("primary_endpoints_verbatim", [])
        verbatim_secondary = content.get("secondary_endpoints_verbatim", [])
        verbatim_exploratory = content.get("exploratory_endpoints_verbatim", [])

        try:
            # Create a copy for polishing, excluding verbatim fields
            content_to_polish = {
                k: v for k, v in content.items()
                if not k.endswith("_verbatim")
            }

            polish_prompt = f"""You are a senior biostatistician polishing a Statistical Analysis Plan.

Refine the following SAP content for:
1. Precise statistical terminology aligned with ICH E9 guidelines
2. Clear, unambiguous descriptions of statistical methods
3. Consistent use of statistical terms (e.g., "estimate" vs "calculate")
4. Professional regulatory document language

DO NOT modify:
- The actual statistical methods or approaches
- Numerical values or thresholds
- Population definitions

Content to polish:
{json.dumps(content_to_polish, indent=2)}

Return the polished content as valid JSON with the same structure."""

            response = await self.claude.generate(
                prompt=polish_prompt,
                system=(
                    "You are a senior biostatistician specializing in clinical trial SAPs. "
                    "Polish the statistical language while preserving technical accuracy. "
                    "Follow ICH E9 guidelines for terminology."
                ),
                temperature=0.2,
                max_tokens=10000,
            )

            polished = self._parse_json_response(response)

            # Restore verbatim endpoints - MUST NOT be modified
            polished["primary_endpoints_verbatim"] = verbatim_primary
            polished["secondary_endpoints_verbatim"] = verbatim_secondary
            polished["exploratory_endpoints_verbatim"] = verbatim_exploratory

            logger.debug("SAP content polished successfully")
            return polished

        except Exception as e:
            logger.warning(f"SAP polish failed, using original content: {e}")
            return content

    def build_document(
        self,
        content: dict,
        protocol_data: dict,
        user_id: str,
    ) -> UniversalDocument:
        """
        Build UniversalDocument from SAP content.

        Args:
            content: AI-generated SAP content
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
            document_type="sap",
            title="STATISTICAL ANALYSIS PLAN",
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
                header_text=f"Statistical Analysis Plan - {protocol_number}" if protocol_number else "Statistical Analysis Plan",
                show_page_numbers=True,
                page_number_position="footer_right",
                include_total_pages=True,
            ),
            compliance=ComplianceMetadata(
                generated_by="gpt-5-nano",
                polished_by="claude" if self.requires_polish and self.claude else None,
                regulatory_framework="ICH E9",
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
        Build all SAP sections from content.

        Args:
            content: AI-generated content dictionary
            protocol_data: Original protocol data

        Returns:
            List of Section objects
        """
        sections = []

        # Title page
        sections.append(self._build_title_page(protocol_data))

        # Version history
        sections.append(self._build_version_history())

        # Table of contents placeholder
        sections.append(self._build_toc_placeholder())

        # 1. Introduction
        sections.append(self._build_introduction_section(content, protocol_data))

        # 2. Study Objectives and Endpoints (with VERBATIM endpoints)
        sections.append(self._build_endpoints_section(content, protocol_data))

        # 3. Study Design
        sections.append(self._build_study_design_section(content, protocol_data))

        # 4. Analysis Populations
        sections.append(self._build_populations_section(content))

        # 5. Statistical Methods
        sections.append(self._build_statistical_methods_section(content))

        # 6. Sample Size
        sections.append(self._build_sample_size_section(content, protocol_data))

        # 7. Missing Data
        sections.append(self._build_missing_data_section(content))

        # 8. Interim Analysis
        sections.append(self._build_interim_analysis_section(content, protocol_data))

        # 9. Tables, Listings, and Figures
        sections.append(self._build_tlf_section(content))

        # Signature page
        sections.append(self._build_signature_page())

        return sections

    def _build_title_page(self, protocol_data: dict) -> Section:
        """Build the document title page section."""
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "[Protocol Number]")
        study_title = self._get_metadata_value(protocol_data, "title", "[Study Title]")
        sponsor = self._get_metadata_value(protocol_data, "sponsor", "[Sponsor]")
        phase = self._get_metadata_value(protocol_data, "phase", "")

        content_blocks = [
            ContentBlock(
                type=ContentBlockType.HEADING,
                content="STATISTICAL ANALYSIS PLAN",
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
                spacing_after=6,
            ),
        ]

        if phase:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=f"Phase: {phase}",
                alignment=Alignment.CENTER,
                spacing_after=6,
            ))

        content_blocks.extend([
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="",
                spacing_after=12,
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
                content="This document complies with ICH E9 Statistical Principles for Clinical Trials",
                alignment=Alignment.CENTER,
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=0, end=73, italic=True),
                ]),
                spacing_after=12,
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
        ])

        return Section(
            id="title_page",
            level=1,
            heading="Title Page",
            content_blocks=content_blocks,
        )

    def _build_version_history(self) -> Section:
        """Build the version history section."""
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
                            ["1.0", "[Date]", "[Biostatistician]", "Initial version"],
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

    def _build_introduction_section(
        self,
        content: dict,
        protocol_data: dict,
    ) -> Section:
        """Build the introduction section with ICH E9 reference."""
        intro_text = content.get("introduction", "")
        if not intro_text:
            protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "TBD")
            intro_text = (
                f"This Statistical Analysis Plan (SAP) describes the planned statistical analyses "
                f"for protocol {protocol_number}. This SAP should be read in conjunction with "
                "the study protocol and has been developed in accordance with ICH E9 "
                "Statistical Principles for Clinical Trials.\n\n"
                "The SAP was developed prior to database lock and unblinding. Any deviations "
                "from this plan will be documented and justified in the Clinical Study Report."
            )

        content_blocks = []
        for paragraph in intro_text.split("\n\n"):
            if paragraph.strip():
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=paragraph.strip(),
                    spacing_after=6,
                ))

        # Add ICH E9 reference note
        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Reference: ICH E9 Guideline for Industry - Statistical Principles for Clinical Trials "
                "(September 1998)"
            ),
            formatting=InlineFormatting(ranges=[
                InlineFormat(start=0, end=96, italic=True),
            ]),
            spacing_before=12,
            spacing_after=6,
        ))

        return Section(
            id="introduction",
            level=1,
            heading="1. INTRODUCTION",
            content_blocks=content_blocks,
        )

    def _build_endpoints_section(
        self,
        content: dict,
        protocol_data: dict,
    ) -> Section:
        """
        Build study objectives and endpoints section.

        CRITICAL: Endpoints are copied VERBATIM from the protocol.
        """
        objectives_data = content.get("objectives_and_endpoints", {})

        subsections = []

        # 2.1 Primary Objective
        primary_objective = objectives_data.get("primary_objective", "")
        if not primary_objective:
            indication = self._get_metadata_value(protocol_data, "indication", "the target indication")
            primary_objective = f"To evaluate the efficacy and safety of the investigational product in patients with {indication}."

        subsections.append(Section(
            id="primary_objective",
            level=2,
            heading="2.1 Primary Objective",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=primary_objective,
                    spacing_after=6,
                ),
            ],
        ))

        # 2.2 Primary Endpoints (VERBATIM)
        primary_endpoints = content.get("primary_endpoints_verbatim", [])
        primary_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="The primary endpoint(s) are (verbatim from protocol):",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=28, end=51, bold=True, italic=True),
                ]),
                spacing_after=6,
            ),
        ]

        if primary_endpoints:
            # Format endpoints as numbered list
            formatted_endpoints = self._format_list_items(primary_endpoints)
            primary_blocks.append(ContentBlock(
                type=ContentBlockType.NUMBERED_LIST,
                items=formatted_endpoints,
                list_style=ListStyle.DECIMAL,
            ))
        else:
            primary_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="[Primary endpoints to be extracted from protocol]",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=0, end=49, italic=True),
                ]),
                spacing_after=6,
            ))

        subsections.append(Section(
            id="primary_endpoints",
            level=2,
            heading="2.2 Primary Endpoint(s)",
            content_blocks=primary_blocks,
        ))

        # 2.3 Secondary Objectives
        secondary_objectives = objectives_data.get("secondary_objectives", "")
        if not secondary_objectives:
            secondary_objectives = "To evaluate secondary efficacy measures and characterize the safety profile."

        subsections.append(Section(
            id="secondary_objectives",
            level=2,
            heading="2.3 Secondary Objectives",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=secondary_objectives,
                    spacing_after=6,
                ),
            ],
        ))

        # 2.4 Secondary Endpoints (VERBATIM)
        secondary_endpoints = content.get("secondary_endpoints_verbatim", [])
        secondary_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="The secondary endpoint(s) are (verbatim from protocol):",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=30, end=53, bold=True, italic=True),
                ]),
                spacing_after=6,
            ),
        ]

        if secondary_endpoints:
            formatted_endpoints = self._format_list_items(secondary_endpoints)
            secondary_blocks.append(ContentBlock(
                type=ContentBlockType.NUMBERED_LIST,
                items=formatted_endpoints,
                list_style=ListStyle.DECIMAL,
            ))
        else:
            secondary_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="[Secondary endpoints to be extracted from protocol]",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=0, end=51, italic=True),
                ]),
                spacing_after=6,
            ))

        subsections.append(Section(
            id="secondary_endpoints",
            level=2,
            heading="2.4 Secondary Endpoint(s)",
            content_blocks=secondary_blocks,
        ))

        # 2.5 Exploratory Endpoints (if any)
        exploratory_endpoints = content.get("exploratory_endpoints_verbatim", [])
        if exploratory_endpoints:
            exploratory_blocks = [
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="The exploratory endpoint(s) are (verbatim from protocol):",
                    formatting=InlineFormatting(ranges=[
                        InlineFormat(start=32, end=55, bold=True, italic=True),
                    ]),
                    spacing_after=6,
                ),
            ]
            formatted_endpoints = self._format_list_items(exploratory_endpoints)
            exploratory_blocks.append(ContentBlock(
                type=ContentBlockType.NUMBERED_LIST,
                items=formatted_endpoints,
                list_style=ListStyle.DECIMAL,
            ))

            subsections.append(Section(
                id="exploratory_endpoints",
                level=2,
                heading="2.5 Exploratory Endpoint(s)",
                content_blocks=exploratory_blocks,
            ))

        return Section(
            id="objectives_endpoints",
            level=1,
            heading="2. STUDY OBJECTIVES AND ENDPOINTS",
            content_blocks=[],
            subsections=subsections,
        )

    def _build_study_design_section(
        self,
        content: dict,
        protocol_data: dict,
    ) -> Section:
        """Build study design overview section."""
        design_text = content.get("study_design_summary", "")

        if not design_text:
            study_type = self._get_design_value(protocol_data, "study_type", "randomized")
            blinding = self._get_design_value(protocol_data, "blinding", "double-blind")
            enrollment = self._get_design_value(protocol_data, "planned_enrollment", "N")
            ratio = self._get_design_value(protocol_data, "randomization_ratio", "1:1")

            design_text = (
                f"This is a {study_type}, {blinding} study. Approximately {enrollment} subjects "
                f"will be randomized in a {ratio} ratio."
            )

        content_blocks = []
        for paragraph in design_text.split("\n\n"):
            if paragraph.strip():
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=paragraph.strip(),
                    spacing_after=6,
                ))

        # Add study parameters if available
        design = protocol_data.get("design", {})
        if isinstance(design, dict) and design:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="3.1 Key Study Parameters",
                level=2,
                spacing_before=12,
                spacing_after=6,
            ))

            # Build key parameters table
            param_rows = []

            if design.get("study_type"):
                param_rows.append(["Study Type", design.get("study_type", "N/A")])
            if design.get("blinding"):
                param_rows.append(["Blinding", design.get("blinding", "N/A")])
            if design.get("planned_enrollment"):
                param_rows.append(["Planned Enrollment", str(design.get("planned_enrollment", "N/A"))])
            if design.get("randomization_ratio"):
                param_rows.append(["Randomization Ratio", design.get("randomization_ratio", "N/A")])
            if design.get("study_duration_weeks"):
                param_rows.append(["Study Duration", f"{design.get('study_duration_weeks')} weeks"])

            if param_rows:
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.TABLE,
                    table=TableBlock(
                        headers=["Parameter", "Value"],
                        rows=param_rows,
                        column_widths=[3.0, 4.0],
                        header_background="#4472C4",
                    ),
                ))

        return Section(
            id="study_design",
            level=1,
            heading="3. STUDY DESIGN OVERVIEW",
            content_blocks=content_blocks,
        )

    def _build_populations_section(self, content: dict) -> Section:
        """Build analysis populations section with table."""
        populations = content.get("analysis_populations", {})

        if not populations:
            populations = {
                "itt": "Intent-to-Treat (ITT): All randomized subjects",
                "mitt": "Modified ITT (mITT): All randomized subjects who received at least one dose of study drug",
                "per_protocol": "Per-Protocol (PP): All subjects who completed the study without major protocol deviations",
                "safety": "Safety Population: All subjects who received at least one dose of study drug",
            }

        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="The following analysis populations are defined for this study:",
                spacing_after=6,
            ),
        ]

        # Build populations table
        pop_rows = [
            ["ITT (Intent-to-Treat)", populations.get("itt", "All randomized subjects"), "Secondary"],
            ["mITT (Modified ITT)", populations.get("mitt", "Randomized + received at least 1 dose"), "Primary efficacy"],
            ["PP (Per-Protocol)", populations.get("per_protocol", "Completed without major deviations"), "Sensitivity"],
            ["Safety", populations.get("safety", "Received at least 1 dose of study drug"), "Safety analyses"],
        ]

        content_blocks.append(ContentBlock(
            type=ContentBlockType.TABLE,
            table=TableBlock(
                headers=["Population", "Definition", "Primary Use"],
                rows=pop_rows,
                column_widths=[2.0, 3.5, 1.5],
                header_background="#4472C4",
            ),
        ))

        # Add handling of population assignment
        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content="4.1 Population Assignment",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Assignment to analysis populations will be finalized prior to database lock "
                "and documented in the statistical programming specifications. Any subjects "
                "excluded from a population will be documented with the reason for exclusion."
            ),
            spacing_after=6,
        ))

        return Section(
            id="populations",
            level=1,
            heading="4. ANALYSIS POPULATIONS",
            content_blocks=content_blocks,
        )

    def _build_statistical_methods_section(self, content: dict) -> Section:
        """Build statistical methods section with subsections."""
        methods = content.get("statistical_methods", {})

        subsections = []

        # 5.1 General Considerations
        general = methods.get("general", "")
        if not general:
            general = (
                "All statistical analyses will be performed using SAS Version 9.4 or later. "
                "A two-sided significance level of 0.05 will be used for all statistical tests "
                "unless otherwise specified. Confidence intervals will be presented as 95% CIs."
            )

        subsections.append(Section(
            id="general_stats",
            level=2,
            heading="5.1 General Statistical Considerations",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=general,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=(
                        "Continuous variables will be summarized with descriptive statistics "
                        "(n, mean, standard deviation, median, minimum, maximum). Categorical "
                        "variables will be summarized with counts and percentages."
                    ),
                    spacing_after=6,
                ),
            ],
        ))

        # 5.2 Primary Endpoint Analysis
        primary = methods.get("primary_analysis", "")
        if not primary:
            primary = (
                "The primary efficacy analysis will be based on the mITT population. "
                "The primary endpoint will be analyzed using an appropriate statistical method "
                "based on the endpoint type and study design."
            )

        subsections.append(Section(
            id="primary_analysis",
            level=2,
            heading="5.2 Primary Endpoint Analysis",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=primary,
                    spacing_after=6,
                ),
            ],
        ))

        # 5.3 Secondary Endpoint Analysis
        secondary = methods.get("secondary_analysis", "")
        if not secondary:
            secondary = (
                "Secondary endpoints will be analyzed using appropriate statistical methods. "
                "No adjustments for multiplicity will be made for secondary endpoints; "
                "therefore, these analyses are considered exploratory."
            )

        subsections.append(Section(
            id="secondary_analysis",
            level=2,
            heading="5.3 Secondary Endpoint Analysis",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=secondary,
                    spacing_after=6,
                ),
            ],
        ))

        # 5.4 Safety Analysis
        safety = methods.get("safety_analysis", "")
        if not safety:
            safety = (
                "Safety analyses will be conducted on the Safety Population. Adverse events "
                "will be summarized by System Organ Class (SOC) and Preferred Term (PT) using "
                "MedDRA coding. Treatment-emergent adverse events (TEAEs) will be defined as "
                "events with onset on or after the first dose of study drug."
            )

        subsections.append(Section(
            id="safety_analysis",
            level=2,
            heading="5.4 Safety Analysis",
            content_blocks=[
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=safety,
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=(
                        "Laboratory parameters, vital signs, and other safety measures will be "
                        "summarized descriptively by treatment group and time point. Changes from "
                        "baseline will be calculated and presented."
                    ),
                    spacing_after=6,
                ),
            ],
        ))

        return Section(
            id="statistical_methods",
            level=1,
            heading="5. STATISTICAL METHODS",
            content_blocks=[],
            subsections=subsections,
        )

    def _build_sample_size_section(
        self,
        content: dict,
        protocol_data: dict,
    ) -> Section:
        """Build sample size and power section."""
        sample_size = content.get("sample_size", "")

        if not sample_size:
            enrollment = self._get_design_value(protocol_data, "planned_enrollment", "N")
            sample_size = (
                f"The planned sample size is {enrollment} subjects. Sample size calculations "
                "are provided in the protocol. The study is powered to detect a clinically "
                "meaningful difference in the primary endpoint with adequate statistical power."
            )

        content_blocks = []
        for paragraph in sample_size.split("\n\n"):
            if paragraph.strip():
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=paragraph.strip(),
                    spacing_after=6,
                ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Sample size re-estimation is not planned for this study unless otherwise "
                "specified in the protocol."
            ),
            spacing_after=6,
        ))

        return Section(
            id="sample_size",
            level=1,
            heading="6. SAMPLE SIZE AND POWER",
            content_blocks=content_blocks,
        )

    def _build_missing_data_section(self, content: dict) -> Section:
        """Build missing data handling section."""
        missing = content.get("missing_data", "")

        if not missing:
            missing = (
                "Missing data will be handled using appropriate methods. The primary analysis "
                "will use observed data. The following sensitivity analyses may be conducted:\n\n"
                "- Multiple imputation for missing endpoint data\n"
                "- Last observation carried forward (LOCF) as a sensitivity analysis\n"
                "- Tipping point analysis for missing data under varying assumptions"
            )

        content_blocks = []
        paragraphs = missing.split("\n\n")
        for paragraph in paragraphs:
            if paragraph.strip().startswith("-"):
                # This is a list, convert to bullet points
                items = [line.strip().lstrip("-").strip() for line in paragraph.split("\n") if line.strip()]
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.BULLET_LIST,
                    items=items,
                ))
            else:
                content_blocks.append(ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content=paragraph.strip(),
                    spacing_after=6,
                ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "The approach for handling missing data will be finalized prior to database lock "
                "and documented in the statistical programming specifications."
            ),
            spacing_after=6,
        ))

        return Section(
            id="missing_data",
            level=1,
            heading="7. HANDLING OF MISSING DATA",
            content_blocks=content_blocks,
        )

    def _build_interim_analysis_section(
        self,
        content: dict,
        protocol_data: dict,
    ) -> Section:
        """Build interim analysis section."""
        interim = content.get("interim_analysis", "")

        if not interim:
            interim = (
                "No formal interim analysis is planned for this study unless otherwise "
                "specified in the protocol."
            )

        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=interim,
                spacing_after=6,
            ),
        ]

        # Check if interim analysis is specified
        design = protocol_data.get("design", {})
        if isinstance(design, dict) and design.get("interim_analysis"):
            content_blocks.append(ContentBlock(
                type=ContentBlockType.HEADING,
                content="8.1 Interim Analysis Details",
                level=2,
                spacing_before=12,
                spacing_after=6,
            ))
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=design.get("interim_analysis", ""),
                spacing_after=6,
            ))
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content=(
                    "If an interim analysis is conducted, appropriate alpha-spending functions "
                    "will be used to control the overall Type I error rate. The Data Safety "
                    "Monitoring Board (DSMB) charter will specify the stopping rules."
                ),
                spacing_after=6,
            ))

        return Section(
            id="interim_analysis",
            level=1,
            heading="8. INTERIM ANALYSIS",
            content_blocks=content_blocks,
        )

    def _build_tlf_section(self, content: dict) -> Section:
        """Build Tables, Listings, and Figures (TLF) shells section."""
        tlf_shells = content.get("tlf_shells", [])

        if not tlf_shells:
            tlf_shells = [
                "Table 14.1.1: Subject Disposition",
                "Table 14.1.2: Protocol Deviations",
                "Table 14.2.1: Demographics and Baseline Characteristics",
                "Table 14.2.2: Medical History",
                "Table 14.3.1: Primary Efficacy Analysis",
                "Table 14.3.2: Secondary Efficacy Analyses",
                "Table 14.4.1: Overall Summary of Treatment-Emergent Adverse Events",
                "Table 14.4.2: Treatment-Emergent Adverse Events by System Organ Class and Preferred Term",
                "Table 14.4.3: Serious Adverse Events",
                "Table 14.4.4: Laboratory Parameters Summary",
                "Listing 16.2.1: Subject Demographics",
                "Listing 16.2.2: All Adverse Events",
                "Listing 16.2.3: Serious Adverse Events",
                "Listing 16.2.4: Concomitant Medications",
                "Figure 14.2.1: Primary Endpoint Over Time",
                "Figure 14.2.2: Kaplan-Meier Plot (if applicable)",
            ]

        content_blocks = [
            ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="The following Tables, Listings, and Figures (TLFs) will be produced for this study:",
                spacing_after=6,
            ),
            ContentBlock(
                type=ContentBlockType.HEADING,
                content="9.1 Tables",
                level=2,
                spacing_before=12,
                spacing_after=6,
            ),
        ]

        # Separate tables, listings, and figures
        tables = [t for t in tlf_shells if t.lower().startswith("table")]
        listings = [l for l in tlf_shells if l.lower().startswith("listing")]
        figures = [f for f in tlf_shells if f.lower().startswith("figure")]

        if tables:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.BULLET_LIST,
                items=tables,
            ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content="9.2 Listings",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        if listings:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.BULLET_LIST,
                items=listings,
            ))
        else:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="[Listings to be defined in TLF specifications]",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=0, end=46, italic=True),
                ]),
                spacing_after=6,
            ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.HEADING,
            content="9.3 Figures",
            level=2,
            spacing_before=12,
            spacing_after=6,
        ))

        if figures:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.BULLET_LIST,
                items=figures,
            ))
        else:
            content_blocks.append(ContentBlock(
                type=ContentBlockType.PARAGRAPH,
                content="[Figures to be defined in TLF specifications]",
                formatting=InlineFormatting(ranges=[
                    InlineFormat(start=0, end=45, italic=True),
                ]),
                spacing_after=6,
            ))

        content_blocks.append(ContentBlock(
            type=ContentBlockType.PARAGRAPH,
            content=(
                "Detailed TLF shells and programming specifications will be provided in a "
                "separate TLF Shells document."
            ),
            spacing_before=12,
            spacing_after=6,
        ))

        return Section(
            id="tlf_shells",
            level=1,
            heading="9. TABLES, LISTINGS, AND FIGURES",
            content_blocks=content_blocks,
        )

    def _build_signature_page(self) -> Section:
        """Build the signature page section."""
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
                    content=(
                        "This Statistical Analysis Plan has been reviewed and approved by the "
                        "undersigned. Any deviations from this plan will be documented and justified "
                        "in the Clinical Study Report."
                    ),
                    spacing_after=24,
                ),
                # Lead Biostatistician
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_before=24,
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Lead Biostatistician",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Name: ________________________________",
                    spacing_after=24,
                ),
                # Medical Monitor
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Medical Monitor",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Name: ________________________________",
                    spacing_after=24,
                ),
                # Sponsor Representative
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="_" * 50 + "    Date: _____________",
                    spacing_after=3,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Sponsor Representative",
                    spacing_after=6,
                ),
                ContentBlock(
                    type=ContentBlockType.PARAGRAPH,
                    content="Name: ________________________________",
                    spacing_after=12,
                ),
            ],
        )

    def _generate_fallback_content(self, protocol_data: dict) -> dict:
        """
        Generate fallback SAP content without AI.

        Used when OpenAI is unavailable or fails.

        Args:
            protocol_data: Protocol data dictionary

        Returns:
            Dictionary of fallback SAP content
        """
        protocol_number = self._get_metadata_value(protocol_data, "protocol_number", "TBD")
        indication = self._get_metadata_value(protocol_data, "indication", "the target indication")
        study_type = self._get_design_value(protocol_data, "study_type", "randomized")
        enrollment = self._get_design_value(protocol_data, "planned_enrollment", "N")
        endpoints = protocol_data.get("endpoints", {})

        return {
            "introduction": (
                f"This Statistical Analysis Plan (SAP) describes the planned statistical analyses "
                f"for protocol {protocol_number}. This SAP should be read in conjunction with the "
                "study protocol and has been developed in accordance with ICH E9 Statistical "
                "Principles for Clinical Trials.\n\n"
                "The SAP was finalized prior to database lock and unblinding. Any deviations "
                "from this plan will be documented and justified in the Clinical Study Report."
            ),
            "objectives_and_endpoints": {
                "primary_objective": (
                    f"To evaluate the efficacy and safety of the investigational product in "
                    f"patients with {indication}."
                ),
                "secondary_objectives": (
                    "To evaluate secondary efficacy measures and characterize the safety profile."
                ),
            },
            "primary_endpoints_verbatim": endpoints.get("primary", []),
            "secondary_endpoints_verbatim": endpoints.get("secondary", []),
            "exploratory_endpoints_verbatim": endpoints.get("exploratory", []),
            "study_design_summary": (
                f"This is a {study_type} study. Approximately {enrollment} subjects will be "
                "enrolled. The study design details are provided in the protocol."
            ),
            "analysis_populations": {
                "itt": "Intent-to-Treat (ITT): All randomized subjects",
                "mitt": "Modified ITT (mITT): All randomized subjects who received at least one dose of study drug",
                "per_protocol": "Per-Protocol (PP): All subjects who completed the study without major protocol deviations",
                "safety": "Safety Population: All subjects who received at least one dose of study drug",
            },
            "statistical_methods": {
                "general": (
                    "All statistical analyses will be performed using SAS Version 9.4 or later. "
                    "A two-sided significance level of 0.05 will be used unless otherwise specified."
                ),
                "primary_analysis": (
                    "The primary efficacy analysis will be based on the mITT population. "
                    "The primary endpoint will be analyzed using appropriate statistical methods."
                ),
                "secondary_analysis": (
                    "Secondary endpoints will be analyzed using appropriate statistical methods. "
                    "No adjustments for multiplicity will be made for secondary endpoints."
                ),
                "safety_analysis": (
                    "Safety analyses will be conducted on the Safety Population. Adverse events "
                    "will be summarized by System Organ Class and Preferred Term using MedDRA coding."
                ),
            },
            "sample_size": (
                f"The planned sample size is {enrollment} subjects. Sample size calculations "
                "are provided in the protocol."
            ),
            "missing_data": (
                "Missing data will be handled using appropriate methods. The primary analysis "
                "will use observed data. Sensitivity analyses may include multiple imputation "
                "or last observation carried forward."
            ),
            "interim_analysis": (
                "No formal interim analysis is planned unless specified in the protocol."
            ),
            "tlf_shells": [
                "Table 14.1.1: Subject Disposition",
                "Table 14.2.1: Demographics and Baseline Characteristics",
                "Table 14.3.1: Primary Efficacy Analysis",
                "Table 14.4.1: Overall Summary of Treatment-Emergent Adverse Events",
                "Table 14.4.2: Treatment-Emergent Adverse Events by System Organ Class and Preferred Term",
                "Listing 16.2.1: Subject Demographics",
                "Listing 16.2.2: All Adverse Events",
                "Figure 14.2.1: Primary Endpoint Over Time",
            ],
        }
