"""
Translation package for parallel batched document translation.

This package provides optimized translation for UIF documents using:
- Batching: Group text items into fewer API calls
- Parallelization: Concurrent API calls with rate limiting
- Caching: Memoize repeated translations

Usage:
    from app.modules.documents.translation import ParallelTranslator

    translator = ParallelTranslator(openai_client)
    translated_uif = await translator.translate_uif(uif, "es")
"""

from .parallel_translator import ParallelTranslator
from .batcher import TextItem, TranslationBatch, create_batches
from .cache import TranslationCache

__all__ = [
    "ParallelTranslator",
    "TextItem",
    "TranslationBatch",
    "create_batches",
    "TranslationCache",
]
