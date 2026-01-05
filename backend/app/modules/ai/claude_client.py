"""Claude AI client for document polishing and readability checks."""

import logging
from typing import Optional
import anthropic
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class ClaudeError(Exception):
    """Base exception for Claude errors."""
    pass


class ClaudeRateLimitError(ClaudeError):
    """Rate limit exceeded."""
    pass


class ClaudeClient:
    """Client for Anthropic Claude API."""

    MODEL_NAME = "claude-sonnet-4-20250514"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude client.

        Args:
            api_key: Anthropic API key (defaults to settings)
        """
        self.api_key = api_key or settings.anthropic_api_key

        if self.api_key:
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
            logger.info(f"Claude client initialized with model: {self.MODEL_NAME}")
        else:
            self.client = None
            logger.warning("Anthropic API key not configured")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((ClaudeRateLimitError, ConnectionError)),
    )
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """
        Generate text from a prompt.

        Args:
            prompt: Input prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature

        Returns:
            Generated text response
        """
        if not self.client:
            raise ClaudeError("Claude client not initialized - API key missing")

        try:
            messages = [{"role": "user", "content": prompt}]

            kwargs = {
                "model": self.MODEL_NAME,
                "max_tokens": max_tokens,
                "messages": messages,
                "temperature": temperature,
            }

            if system:
                kwargs["system"] = system

            response = await self.client.messages.create(**kwargs)

            if not response.content:
                raise ClaudeError("Empty response from Claude")

            return response.content[0].text

        except anthropic.RateLimitError as e:
            logger.warning(f"Rate limit hit: {e}")
            raise ClaudeRateLimitError(str(e))
        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            raise ClaudeError(f"API error: {e}")
        except Exception as e:
            logger.error(f"Claude generation error: {e}")
            raise ClaudeError(f"Generation failed: {e}")

    async def polish_regulatory_text(
        self,
        content: str,
        document_type: str,
        guidelines: str = "",
    ) -> str:
        """
        Polish regulatory document text for readability and compliance.

        Args:
            content: Document content (JSON string)
            document_type: Type of document (ICF, DMP, SAP)
            guidelines: Specific guidelines to follow

        Returns:
            Polished content (JSON string)
        """
        system_prompt = f"""You are an expert regulatory medical writer specializing in {document_type} documents.

Your task is to polish the provided document content to:
1. Improve readability while maintaining regulatory compliance
2. Ensure consistent professional tone
3. Remove any remaining medical jargon (replace with plain language)
4. Ensure sentences are clear and concise
5. Verify no exculpatory or coercive language is present

{guidelines}

IMPORTANT:
- Maintain the exact JSON structure of the input
- Do not add new fields or remove existing ones
- Only modify the text content within each field
- Return ONLY valid JSON, no markdown formatting or explanations"""

        prompt = f"""Please polish the following {document_type} content:

{content}

Return the polished content in the same JSON structure. Only output valid JSON."""

        return await self.generate(
            prompt=prompt,
            system=system_prompt,
            temperature=0.2,
        )

    async def check_readability(
        self,
        content: str,
        target_grade_level: int = 8,
    ) -> dict:
        """
        Check document readability and suggest improvements.

        Args:
            content: Document text content
            target_grade_level: Target reading grade level

        Returns:
            Dict with readability assessment and suggestions
        """
        prompt = f"""Analyze the following text for readability:

{content}

Provide your analysis as JSON:
{{
  "estimated_grade_level": <number>,
  "meets_target": <true/false>,
  "issues": [
    {{
      "text": "problematic text",
      "issue": "description of issue",
      "suggestion": "improved version"
    }}
  ],
  "overall_assessment": "brief summary"
}}

Target grade level: {target_grade_level}
Return ONLY valid JSON."""

        response = await self.generate(prompt, temperature=0.1)

        # Parse JSON response
        import json
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            return {
                "estimated_grade_level": None,
                "meets_target": False,
                "issues": [],
                "overall_assessment": "Unable to analyze readability",
            }

    async def validate_compliance(
        self,
        content: str,
        document_type: str,
        regulation: str = "21 CFR 50.25",
    ) -> dict:
        """
        Validate document for regulatory compliance.

        Args:
            content: Document content
            document_type: Type of document
            regulation: Regulatory reference

        Returns:
            Dict with compliance assessment
        """
        prompt = f"""Review the following {document_type} content for compliance with {regulation}:

{content}

Provide your analysis as JSON:
{{
  "compliant": <true/false>,
  "required_elements_present": [
    {{"element": "name", "present": true/false, "notes": "details"}}
  ],
  "prohibited_language_found": [
    {{"type": "exculpatory/coercive", "text": "problematic text", "location": "section"}}
  ],
  "recommendations": ["list of improvements"]
}}

Return ONLY valid JSON."""

        response = await self.generate(prompt, temperature=0.1)

        # Parse JSON response
        import json
        try:
            return json.loads(response.strip())
        except json.JSONDecodeError:
            return {
                "compliant": False,
                "required_elements_present": [],
                "prohibited_language_found": [],
                "recommendations": ["Unable to complete compliance check"],
            }


# Global client instance
claude_client = ClaudeClient()
