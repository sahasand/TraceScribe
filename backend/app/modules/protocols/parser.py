"""Protocol PDF parser using OpenAI GPT-5 Nano."""

import json
import logging
from typing import Optional

from app.modules.protocols.schemas import ExtractedProtocol

logger = logging.getLogger(__name__)

# Extraction prompt from skills/protocol-analyzer/references/extraction-prompt.md
EXTRACTION_PROMPT = """You are a clinical trial protocol analyst. Extract structured data from this protocol.

RULES:
- Extract endpoints VERBATIM
- Simplify eligibility to 5-10 key criteria
- Include AE frequencies when available
- CRITICAL: Extract specific visit names (e.g., "Screening Visit", "Week 4", "Week 12") with timing
- CRITICAL: Extract blood volumes in mL for ALL blood draws
- Use null for missing fields
- Flag sections needing review

OUTPUT: Valid JSON matching this schema:

{
  "metadata": {
    "protocol_number": "string",
    "title": "string",
    "sponsor": "string",
    "phase": "string",
    "indication": "string",
    "version": "string"
  },
  "design": {
    "study_type": "interventional|observational|device",
    "design": "string - full description",
    "arms": ["array of arm names"],
    "randomization_ratio": "string or null",
    "blinding": "open|single-blind|double-blind",
    "control": "placebo|active|none|null",
    "planned_enrollment": integer,
    "study_duration_weeks": integer
  },
  "endpoints": {
    "primary": ["VERBATIM from protocol"],
    "secondary": ["VERBATIM from protocol"]
  },
  "eligibility": {
    "inclusion": ["5-10 simplified criteria"],
    "exclusion": ["5-10 simplified criteria"],
    "age_range": "string",
    "sex": "All|Male|Female"
  },
  "procedures": [
    {
      "name": "string",
      "plain_language": "patient-friendly description",
      "frequency": "string",
      "visits": ["which visits"],
      "blood_volume_ml": integer or null
    }
  ],
  "visits": [
    {
      "name": "string",
      "timing": "string",
      "procedures": ["procedure names"],
      "estimated_duration_hours": number
    }
  ],
  "adverse_events": [
    {
      "term": "medical term",
      "plain_language": "patient term",
      "frequency": "Very common (>10%)|Common (1-10%)|Uncommon (<1%)|Rare|Unknown",
      "severity": "mild|moderate|severe"
    }
  ],
  "investigational_product": {
    "name": "string",
    "type": "small molecule|biologic|device",
    "route": "oral|IV|subcutaneous|etc",
    "dose": "string",
    "frequency": "string",
    "duration": "string"
  },
  "confidence_flags": ["sections needing review"]
}

Return ONLY valid JSON, no markdown formatting."""


class ProtocolParser:
    """Parse protocol PDFs using OpenAI GPT-5 Nano."""

    def __init__(self, openai_client):
        """
        Initialize parser with OpenAI client.

        Args:
            openai_client: OpenAIClient instance
        """
        self.openai = openai_client

    async def parse(self, pdf_bytes: bytes) -> ExtractedProtocol:
        """
        Parse a protocol PDF and extract structured data.

        Args:
            pdf_bytes: PDF file content

        Returns:
            ExtractedProtocol with all extracted data
        """
        logger.info("Starting protocol parsing with GPT-5 Nano")

        # Call OpenAI with PDF
        response = await self.openai.generate_with_pdf(
            prompt=EXTRACTION_PROMPT,
            pdf_bytes=pdf_bytes,
        )

        # Parse JSON response
        try:
            # Clean up response - remove markdown code blocks if present
            json_str = response.strip()
            if json_str.startswith("```"):
                json_str = json_str.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]
            json_str = json_str.strip()

            data = json.loads(json_str)
            extracted = ExtractedProtocol.model_validate(data)
            logger.info(f"Successfully parsed protocol: {extracted.metadata.title}")
            return extracted

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse GPT-5 Nano response as JSON: {e}")
            raise ValueError(f"Invalid JSON response from GPT-5 Nano: {e}")
        except Exception as e:
            logger.error(f"Failed to validate extracted data: {e}")
            raise ValueError(f"Failed to validate extracted protocol data: {e}")

    async def parse_with_retry(
        self,
        pdf_bytes: bytes,
        max_retries: int = 3,
    ) -> ExtractedProtocol:
        """
        Parse protocol with automatic retry on failure.

        Args:
            pdf_bytes: PDF file content
            max_retries: Maximum number of retry attempts

        Returns:
            ExtractedProtocol with all extracted data
        """
        last_error: Optional[Exception] = None

        for attempt in range(max_retries):
            try:
                return await self.parse(pdf_bytes)
            except Exception as e:
                last_error = e
                logger.warning(f"Parse attempt {attempt + 1} failed: {e}")

                if attempt < max_retries - 1:
                    logger.info("Retrying...")

        raise last_error or ValueError("Failed to parse protocol after retries")
