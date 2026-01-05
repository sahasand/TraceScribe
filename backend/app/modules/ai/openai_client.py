"""OpenAI client for document generation."""

import base64
import logging
from typing import Optional
from openai import AsyncOpenAI
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIError(Exception):
    """Base exception for OpenAI errors."""
    pass


class OpenAIRateLimitError(OpenAIError):
    """Rate limit exceeded."""
    pass


class OpenAIClient:
    """Client for OpenAI API."""

    MODEL_NAME = "gpt-5-nano"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OpenAI client.

        Args:
            api_key: OpenAI API key (defaults to settings)
        """
        self.api_key = api_key or getattr(settings, 'openai_api_key', None)

        if self.api_key:
            self.client = AsyncOpenAI(api_key=self.api_key)
            logger.info(f"OpenAI client initialized with model: {self.MODEL_NAME}")
        else:
            self.client = None
            logger.warning("OpenAI API key not configured")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((OpenAIRateLimitError, ConnectionError)),
    )
    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 4000,
        temperature: float = 1.0,
        model: Optional[str] = None,
    ) -> str:
        """
        Generate text from a prompt.

        Args:
            prompt: Input prompt
            system: Optional system prompt
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (GPT-5 models only support 1.0)
            model: Model override (defaults to gpt-5-nano)

        Returns:
            Generated text response

        Note:
            GPT-5 Nano only supports temperature=1.0. Any other value will fail.
        """
        if not self.client:
            raise OpenAIError("OpenAI client not initialized - API key missing")

        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            # GPT-5 models only support temperature=1.0
            model_name = model or self.MODEL_NAME
            if model_name.startswith("gpt-5"):
                temperature = 1.0

            response = await self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_completion_tokens=max_tokens,  # GPT-5 uses max_completion_tokens
                temperature=temperature,
            )

            if not response.choices:
                raise OpenAIError("Empty response from OpenAI")

            return response.choices[0].message.content

        except Exception as e:
            if "rate_limit" in str(e).lower():
                logger.warning(f"Rate limit hit: {e}")
                raise OpenAIRateLimitError(str(e))
            logger.error(f"OpenAI generation error: {e}")
            raise OpenAIError(f"Generation failed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=60),
        retry=retry_if_exception_type((OpenAIRateLimitError, ConnectionError)),
    )
    async def generate_with_pdf(
        self,
        prompt: str,
        pdf_bytes: bytes,
        filename: str = "document.pdf",
        model: Optional[str] = None,
    ) -> str:
        """
        Generate text from a prompt with PDF file input.

        Args:
            prompt: Input prompt/question about the PDF
            pdf_bytes: PDF file content as bytes
            filename: Optional filename for the PDF
            model: Model override (defaults to gpt-5-nano)

        Returns:
            Generated text response

        Note:
            Uses the Responses API (/v1/responses) which supports PDF inputs.
            GPT-5 Nano supports vision/document understanding.
        """
        if not self.client:
            raise OpenAIError("OpenAI client not initialized - API key missing")

        try:
            # Encode PDF to base64
            base64_string = base64.b64encode(pdf_bytes).decode("utf-8")
            file_data = f"data:application/pdf;base64,{base64_string}"

            # Use responses API for PDF support
            model_name = model or self.MODEL_NAME
            response = await self.client.responses.create(
                model=model_name,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_file",
                                "filename": filename,
                                "file_data": file_data,
                            },
                            {
                                "type": "input_text",
                                "text": prompt,
                            },
                        ],
                    }
                ],
            )

            if not hasattr(response, 'output_text'):
                raise OpenAIError("Invalid response format from OpenAI Responses API")

            return response.output_text

        except Exception as e:
            if "rate_limit" in str(e).lower():
                logger.warning(f"Rate limit hit: {e}")
                raise OpenAIRateLimitError(str(e))
            logger.error(f"OpenAI PDF generation error: {e}")
            raise OpenAIError(f"PDF generation failed: {e}")


# Global client instance
openai_client = OpenAIClient()
