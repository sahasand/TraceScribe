"""
Translation batching utilities.

Groups text items with numbered delimiters for efficient batch translation,
then parses responses back into individual translations.
"""

import re
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)

# Delimiter pattern for batching multiple texts
DELIMITER = "|||{n}|||"
DELIMITER_PATTERN = re.compile(r'\|\|\|(\d+)\|\|\|')


@dataclass
class TextItem:
    """A text item with its path in the UIF structure."""

    path: str
    text: str

    def __hash__(self):
        return hash(self.text)


@dataclass
class TranslationBatch:
    """A batch of text items to translate together."""

    items: List[TextItem] = field(default_factory=list)

    def to_batched_text(self) -> str:
        """
        Combine items into delimiter-separated string for LLM.

        Example output:
        |||0||| First text to translate
        |||1||| Second text to translate
        |||2||| Third text to translate
        """
        parts = []
        for i, item in enumerate(self.items):
            parts.append(f"|||{i}||| {item.text}")
        return "\n".join(parts)

    @staticmethod
    def parse_response(response: str, expected_count: int) -> List[str]:
        """
        Parse delimiter-separated response back to list of translations.

        Args:
            response: LLM response with |||N||| delimiters
            expected_count: Expected number of translations

        Returns:
            List of translated texts in order
        """
        if not response:
            logger.warning("Empty response received, returning empty list")
            return [""] * expected_count

        # Find all delimiter positions
        matches = list(DELIMITER_PATTERN.finditer(response))

        if not matches:
            # No delimiters found - might be single item response
            if expected_count == 1:
                return [clean_translation(response)]
            logger.warning(
                f"No delimiters found in response, expected {expected_count} items. "
                f"Response: {response[:100]}..."
            )
            return [response.strip()] + [""] * (expected_count - 1)

        # Extract text between delimiters
        result = {}
        for i, match in enumerate(matches):
            idx = int(match.group(1))
            start = match.end()

            # Find end of this segment (next delimiter or end of string)
            if i + 1 < len(matches):
                end = matches[i + 1].start()
            else:
                end = len(response)

            text = response[start:end].strip()
            result[idx] = clean_translation(text)

        # Build ordered result list
        translations = []
        for i in range(expected_count):
            if i in result:
                translations.append(result[i])
            else:
                logger.warning(f"Missing translation for index {i}")
                translations.append("")

        return translations


def clean_translation(text: str) -> str:
    """
    Clean a single translated text.

    Removes common LLM artifacts like markdown code blocks,
    wrapper patterns, and trailing notes.
    """
    if not text:
        return ""

    text = text.strip()

    # Remove markdown code blocks
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    # Remove common wrapper patterns
    wrapper_patterns = [
        r'^(?:Here is the |The )?[Tt]ranslation(?:\s+in\s+\w+)?:\s*',
        r'^(?:Here is the |The )?[Tt]ranslated text:\s*',
        r'^[Tt]ranslation:\s*',
    ]
    for pattern in wrapper_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Remove trailing notes
    text = re.sub(r'\s*[\(\[]Note:.*?[\)\]]$', '', text, flags=re.IGNORECASE | re.DOTALL)

    return text.strip()


def create_batches(
    items: List[TextItem],
    max_items: int = 5,  # Reduced for GPT-5 Nano
    max_chars: int = 1000,  # Reduced for GPT-5 Nano
) -> List[TranslationBatch]:
    """
    Create optimally-sized batches from text items.

    Args:
        items: List of text items to batch
        max_items: Maximum items per batch (default 15)
        max_chars: Maximum total characters per batch (default 3000)

    Returns:
        List of TranslationBatch objects
    """
    batches = []
    current_batch = TranslationBatch()
    current_chars = 0

    for item in items:
        item_chars = len(item.text) + 10  # +10 for delimiter overhead

        # Check if adding this item would exceed limits
        if (len(current_batch.items) >= max_items or
            current_chars + item_chars > max_chars):
            # Finalize current batch if non-empty
            if current_batch.items:
                batches.append(current_batch)
                current_batch = TranslationBatch()
                current_chars = 0

        # Add item to current batch
        current_batch.items.append(item)
        current_chars += item_chars

    # Add final batch if non-empty
    if current_batch.items:
        batches.append(current_batch)

    logger.info(f"Created {len(batches)} batches from {len(items)} items")
    return batches
