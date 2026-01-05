"""Gemini AI client for protocol parsing and document generation.

Uses the new google-genai SDK (replaces deprecated google-generativeai).
"""

import logging
from typing import Optional
from google import genai
from google.genai import types
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiError(Exception):
    """Base exception for Gemini errors."""
    pass


class GeminiRateLimitError(GeminiError):
    """Rate limit exceeded."""
    pass


class GeminiClient:
    """Client for Google Gemini AI API using new google-genai SDK."""

    MODEL_NAME = "gemini-3-flash-preview"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Gemini client.

        Args:
            api_key: Gemini API key (defaults to settings)
        """
        self.api_key = api_key or settings.gemini_api_key

        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
            logger.info(f"Gemini client initialized with model: {self.MODEL_NAME}")
        else:
            self.client = None
            logger.warning("Gemini API key not configured")

    def _get_config(
        self,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        thinking: bool = False,
    ) -> types.GenerateContentConfig:
        """Build generation config."""
        config_kwargs = {
            "temperature": temperature if temperature is not None else 0.2,
            "max_output_tokens": max_tokens if max_tokens is not None else 32000,
        }

        # Add thinking config for complex tasks
        if thinking:
            config_kwargs["thinking_config"] = types.ThinkingConfig(
                thinking_budget=1024,
            )

        return types.GenerateContentConfig(**config_kwargs)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((GeminiRateLimitError, ConnectionError)),
    )
    async def generate(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate text from a prompt.

        Args:
            prompt: Input prompt
            temperature: Optional temperature override
            max_tokens: Optional max tokens override

        Returns:
            Generated text response
        """
        if not self.client:
            raise GeminiError("Gemini client not initialized - API key missing")

        try:
            response = await self.client.aio.models.generate_content(
                model=self.MODEL_NAME,
                contents=prompt,
                config=self._get_config(temperature, max_tokens),
            )

            if not response.text:
                raise GeminiError("Empty response from Gemini")

            return response.text

        except Exception as e:
            error_msg = str(e).lower()

            if "rate" in error_msg or "quota" in error_msg:
                logger.warning(f"Rate limit hit: {e}")
                raise GeminiRateLimitError(str(e))

            logger.error(f"Gemini generation error: {e}")
            raise GeminiError(f"Generation failed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((GeminiRateLimitError, ConnectionError)),
    )
    async def generate_with_pdf(
        self,
        prompt: str,
        pdf_bytes: bytes,
        temperature: Optional[float] = None,
    ) -> str:
        """
        Generate text from a prompt with PDF context.

        Args:
            prompt: Input prompt
            pdf_bytes: PDF file bytes
            temperature: Optional temperature override

        Returns:
            Generated text response
        """
        if not self.client:
            raise GeminiError("Gemini client not initialized - API key missing")

        try:
            # Create PDF part using new SDK
            pdf_part = types.Part.from_bytes(
                data=pdf_bytes,
                mime_type="application/pdf",
            )

            response = await self.client.aio.models.generate_content(
                model=self.MODEL_NAME,
                contents=[prompt, pdf_part],
                config=self._get_config(temperature, thinking=True),
            )

            if not response.text:
                raise GeminiError("Empty response from Gemini")

            return response.text

        except Exception as e:
            error_msg = str(e).lower()

            if "rate" in error_msg or "quota" in error_msg:
                logger.warning(f"Rate limit hit: {e}")
                raise GeminiRateLimitError(str(e))

            logger.error(f"Gemini PDF generation error: {e}")
            raise GeminiError(f"PDF generation failed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((GeminiRateLimitError, ConnectionError)),
    )
    async def generate_structured(
        self,
        prompt: str,
        context: Optional[str] = None,
    ) -> str:
        """
        Generate structured JSON output.

        Args:
            prompt: Input prompt (should request JSON output)
            context: Optional additional context

        Returns:
            Generated JSON string
        """
        if not self.client:
            raise GeminiError("Gemini client not initialized - API key missing")

        try:
            full_prompt = prompt
            if context:
                full_prompt = f"{context}\n\n{prompt}"

            response = await self.client.aio.models.generate_content(
                model=self.MODEL_NAME,
                contents=full_prompt,
                config=self._get_config(temperature=0.1),
            )

            if not response.text:
                raise GeminiError("Empty response from Gemini")

            return response.text

        except Exception as e:
            error_msg = str(e).lower()

            if "rate" in error_msg or "quota" in error_msg:
                logger.warning(f"Rate limit hit: {e}")
                raise GeminiRateLimitError(str(e))

            logger.error(f"Gemini structured generation error: {e}")
            raise GeminiError(f"Structured generation failed: {e}")


# Global client instance
gemini_client = GeminiClient()
