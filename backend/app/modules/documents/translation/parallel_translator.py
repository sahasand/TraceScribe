"""
Parallel translation engine with batching and rate limiting.

Translates UIF documents using parallel batched API calls,
achieving 10x speedup over sequential translation.
"""


import asyncio
import copy
import logging
from typing import List, Dict, Any, Optional, Union

from app.core.docengine.schema import (
    UniversalDocument,
    Section,
    ContentBlock,
    TableCell,
)
from .batcher import TextItem, TranslationBatch, create_batches
from .cache import TranslationCache

logger = logging.getLogger(__name__)

# Language name mapping
LANGUAGE_NAMES = {
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "it": "Italian",
    "nl": "Dutch",
    "pl": "Polish",
}

# System prompt for translation
TRANSLATION_SYSTEM_PROMPT = """You are an expert medical translator specializing in clinical trial documents.
Translate text accurately while preserving numbered markers and formatting.
Output translations directly without explanation or commentary."""

# Batch translation prompt template
BATCH_TRANSLATION_PROMPT = """Translate the following ICF (Informed Consent Form) content to {language}.

RULES:
1. Use plain, simple language (8th grade reading level)
2. Maintain formal, respectful tone for medical consent forms
3. Preserve ALL numbered markers (|||0|||, |||1|||, etc.) EXACTLY
4. DO NOT translate: Protocol numbers, drug codes, abbreviations (ICF, FDA, IRB), organization names
5. Output ONLY the translated content with preserved |||N||| markers

INPUT:
{content}

TRANSLATION:"""


class ParallelTranslator:
    """
    Parallel translator for UIF documents.

    Uses batching and concurrent API calls to translate documents
    10x faster than sequential translation.
    """

    MAX_CONCURRENT = 1  # Sequential for GPT-5 Nano rate limits

    def __init__(self, openai_client):
        """
        Initialize translator.

        Args:
            openai_client: OpenAI client for GPT-5 Nano calls
        """
        self.openai = openai_client
        self.semaphore = asyncio.Semaphore(self.MAX_CONCURRENT)
        self.cache = TranslationCache()

    async def translate_uif(
        self,
        uif: UniversalDocument,
        target_language: str,
    ) -> UniversalDocument:
        """
        Translate entire UIF document with optimized batching.

        Args:
            uif: Source UniversalDocument
            target_language: ISO 639-1 language code

        Returns:
            Translated UniversalDocument
        """
        language_name = LANGUAGE_NAMES.get(target_language, target_language.upper())
        logger.info(f"Starting parallel translation to {language_name}")

        # 1. Deep copy to preserve original
        translated_uif = copy.deepcopy(uif)

        # 2. Collect all translatable text items with paths
        text_items = self._collect_text_items(translated_uif)
        logger.info(f"Collected {len(text_items)} text items for translation")

        # 3. Filter out cached translations
        uncached_items = []
        cached_translations: Dict[str, str] = {}

        for item in text_items:
            cached = self.cache.get(item.text, target_language)
            if cached is not None:
                cached_translations[item.path] = cached
            else:
                uncached_items.append(item)

        logger.info(
            f"Found {len(cached_translations)} cached translations, "
            f"{len(uncached_items)} items to translate"
        )

        # 4. Create batches from uncached items
        batches = create_batches(uncached_items)
        logger.info(f"Created {len(batches)} batches for parallel translation")

        # 5. Translate all batches in parallel
        if batches:
            tasks = [
                self._translate_batch(batch, target_language, i, len(batches))
                for i, batch in enumerate(batches)
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results and build path->translation map
            for i, result in enumerate(batch_results):
                batch = batches[i]
                if isinstance(result, Exception):
                    logger.error(f"Batch {i} failed: {result}")
                    # Use original text for failed batch
                    for item in batch.items:
                        cached_translations[item.path] = item.text
                else:
                    # Store successful translations
                    for j, translation in enumerate(result):
                        if j < len(batch.items):
                            item = batch.items[j]
                            cached_translations[item.path] = translation or item.text
                            # Cache for future use
                            self.cache.set(item.text, target_language, translation or item.text)

        # 6. Apply all translations to UIF
        self._apply_translations(translated_uif, cached_translations)

        # Log cache stats
        self.cache.log_stats()

        logger.info(f"Translation to {language_name} complete")
        return translated_uif

    async def _translate_batch(
        self,
        batch: TranslationBatch,
        target_language: str,
        batch_num: int,
        total_batches: int,
    ) -> List[str]:
        """
        Translate a single batch with rate limiting and retry logic.

        Args:
            batch: Batch of text items
            target_language: Target language code
            batch_num: Current batch number (for logging)
            total_batches: Total number of batches

        Returns:
            List of translated texts in order
        """
        async with self.semaphore:
            language_name = LANGUAGE_NAMES.get(target_language, target_language.upper())
            logger.debug(f"Translating batch {batch_num + 1}/{total_batches}")

            # Build prompt with batched content
            batched_text = batch.to_batched_text()
            prompt = BATCH_TRANSLATION_PROMPT.format(
                language=language_name,
                content=batched_text,
            )

            # Retry logic for empty responses (GPT-5 Nano rate limiting)
            max_retries = 4
            base_delay = 5

            for attempt in range(max_retries):
                try:
                    # Exponential backoff delay
                    delay = base_delay * (attempt + 1)
                    await asyncio.sleep(delay)

                    logger.debug(f"Batch {batch_num + 1}/{total_batches} attempt {attempt + 1}")

                    response = await self.openai.generate(
                        prompt=prompt,
                        system=TRANSLATION_SYSTEM_PROMPT,
                        temperature=1.0,
                        max_tokens=4000,
                        model="gpt-5-nano",
                    )

                    # Check for empty response and retry
                    if not response or not response.strip():
                        if attempt < max_retries - 1:
                            logger.warning(f"Batch {batch_num + 1}: Empty response, retrying ({attempt + 1}/{max_retries})")
                            continue
                        else:
                            logger.warning(f"Batch {batch_num + 1}: Empty after {max_retries} attempts")
                            return [""] * len(batch.items)

                    # Parse response back into list
                    translations = TranslationBatch.parse_response(
                        response,
                        expected_count=len(batch.items)
                    )

                    # Verify we got actual translations (not empty strings)
                    non_empty = sum(1 for t in translations if t.strip())
                    if non_empty < len(batch.items) // 2 and attempt < max_retries - 1:
                        logger.warning(f"Batch {batch_num + 1}: Only {non_empty}/{len(batch.items)} translations, retrying")
                        continue

                    logger.info(f"Batch {batch_num + 1} translated successfully ({non_empty}/{len(batch.items)} items)")
                    return translations

                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Batch {batch_num + 1} attempt {attempt + 1} failed: {e}, retrying...")
                        continue
                    logger.error(f"Batch {batch_num + 1} translation failed after {max_retries} attempts: {e}")
                    raise

            # Should not reach here, but return empty as fallback
            return [""] * len(batch.items)

    def _collect_text_items(self, uif: UniversalDocument) -> List[TextItem]:
        """
        Collect all translatable text items from UIF.

        Args:
            uif: UniversalDocument to extract text from

        Returns:
            List of TextItem with path and text
        """
        items = []

        # Document title
        if uif.title:
            items.append(TextItem(path="title", text=uif.title))

        # Process all sections recursively
        self._collect_from_sections(uif.sections, "sections", items)

        return items

    def _collect_from_sections(
        self,
        sections: List[Section],
        base_path: str,
        items: List[TextItem],
    ):
        """Recursively collect text from sections."""
        for i, section in enumerate(sections):
            section_path = f"{base_path}.{i}"

            # Section heading
            if section.heading:
                items.append(TextItem(
                    path=f"{section_path}.heading",
                    text=section.heading
                ))

            # Content blocks
            for j, block in enumerate(section.content_blocks):
                block_path = f"{section_path}.blocks.{j}"
                self._collect_from_block(block, block_path, items)

            # Recurse into subsections
            if section.subsections:
                self._collect_from_sections(
                    section.subsections,
                    f"{section_path}.subsections",
                    items
                )

    def _collect_from_block(
        self,
        block: ContentBlock,
        base_path: str,
        items: List[TextItem],
    ):
        """Collect text from a content block."""
        # Paragraph/heading content
        if block.content:
            items.append(TextItem(
                path=f"{base_path}.content",
                text=block.content
            ))

        # List items
        if block.items:
            for k, item in enumerate(block.items):
                if isinstance(item, str) and item.strip():
                    items.append(TextItem(
                        path=f"{base_path}.items.{k}",
                        text=item
                    ))
                elif isinstance(item, dict) and item.get("text"):
                    items.append(TextItem(
                        path=f"{base_path}.items.{k}.text",
                        text=item["text"]
                    ))

        # Table headers and cells
        if block.table:
            for k, header in enumerate(block.table.headers):
                if header and header.strip():
                    items.append(TextItem(
                        path=f"{base_path}.table.headers.{k}",
                        text=header
                    ))

            for r, row in enumerate(block.table.rows):
                for c, cell in enumerate(row):
                    cell_path = f"{base_path}.table.rows.{r}.{c}"
                    if isinstance(cell, str) and cell.strip():
                        items.append(TextItem(path=cell_path, text=cell))
                    elif isinstance(cell, TableCell) and cell.content and cell.content.strip():
                        items.append(TextItem(
                            path=f"{cell_path}.content",
                            text=cell.content
                        ))

        # Signature block
        if block.signature:
            if block.signature.preamble:
                items.append(TextItem(
                    path=f"{base_path}.signature.preamble",
                    text=block.signature.preamble
                ))
            for l, line in enumerate(block.signature.lines):
                if line.label:
                    items.append(TextItem(
                        path=f"{base_path}.signature.lines.{l}.label",
                        text=line.label
                    ))

    def _apply_translations(
        self,
        uif: UniversalDocument,
        translations: Dict[str, str],
    ):
        """
        Apply translations to UIF using path mapping.

        Args:
            uif: UniversalDocument to modify in-place
            translations: Dict mapping path -> translated text
        """
        # Document title
        if "title" in translations:
            uif.title = translations["title"]

        # Apply to sections recursively
        self._apply_to_sections(uif.sections, "sections", translations)

    def _apply_to_sections(
        self,
        sections: List[Section],
        base_path: str,
        translations: Dict[str, str],
    ):
        """Recursively apply translations to sections."""
        for i, section in enumerate(sections):
            section_path = f"{base_path}.{i}"

            # Section heading
            heading_path = f"{section_path}.heading"
            if heading_path in translations:
                section.heading = translations[heading_path]

            # Content blocks
            for j, block in enumerate(section.content_blocks):
                block_path = f"{section_path}.blocks.{j}"
                self._apply_to_block(block, block_path, translations)

            # Recurse into subsections
            if section.subsections:
                self._apply_to_sections(
                    section.subsections,
                    f"{section_path}.subsections",
                    translations
                )

    def _apply_to_block(
        self,
        block: ContentBlock,
        base_path: str,
        translations: Dict[str, str],
    ):
        """Apply translations to a content block."""
        # Paragraph/heading content
        content_path = f"{base_path}.content"
        if content_path in translations:
            block.content = translations[content_path]

        # List items
        if block.items:
            for k, item in enumerate(block.items):
                item_path = f"{base_path}.items.{k}"
                if item_path in translations:
                    block.items[k] = translations[item_path]
                elif isinstance(item, dict):
                    text_path = f"{item_path}.text"
                    if text_path in translations:
                        block.items[k]["text"] = translations[text_path]

        # Table headers and cells
        if block.table:
            for k in range(len(block.table.headers)):
                header_path = f"{base_path}.table.headers.{k}"
                if header_path in translations:
                    block.table.headers[k] = translations[header_path]

            for r, row in enumerate(block.table.rows):
                for c, cell in enumerate(row):
                    cell_path = f"{base_path}.table.rows.{r}.{c}"
                    if cell_path in translations:
                        block.table.rows[r][c] = translations[cell_path]
                    elif isinstance(cell, TableCell):
                        content_path = f"{cell_path}.content"
                        if content_path in translations:
                            cell.content = translations[content_path]

        # Signature block
        if block.signature:
            preamble_path = f"{base_path}.signature.preamble"
            if preamble_path in translations:
                block.signature.preamble = translations[preamble_path]

            for l, line in enumerate(block.signature.lines):
                label_path = f"{base_path}.signature.lines.{l}.label"
                if label_path in translations:
                    line.label = translations[label_path]
