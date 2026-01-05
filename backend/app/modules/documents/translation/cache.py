"""
Translation cache for memoizing repeated terms.

Caches translations within a single document translation to avoid
translating common terms like "Participant", "Study Doctor" multiple times.
"""

import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TranslationCache:
    """
    In-memory cache for translations within a single document.

    Uses text hash + language as key to lookup cached translations.
    """

    def __init__(self):
        self._cache: Dict[str, str] = {}
        self._hits = 0
        self._misses = 0

    def get(self, text: str, language: str) -> Optional[str]:
        """
        Get cached translation if available.

        Args:
            text: Original text
            language: Target language code

        Returns:
            Cached translation or None
        """
        key = self._make_key(text, language)
        result = self._cache.get(key)

        if result is not None:
            self._hits += 1
            logger.debug(f"Cache hit for '{text[:30]}...'")
        else:
            self._misses += 1

        return result

    def set(self, text: str, language: str, translation: str):
        """
        Store translation in cache.

        Args:
            text: Original text
            language: Target language code
            translation: Translated text
        """
        key = self._make_key(text, language)
        self._cache[key] = translation
        logger.debug(f"Cached translation for '{text[:30]}...'")

    def _make_key(self, text: str, language: str) -> str:
        """Create cache key from text and language."""
        return f"{language}:{hash(text)}"

    @property
    def stats(self) -> Dict[str, int]:
        """Return cache statistics."""
        return {
            "hits": self._hits,
            "misses": self._misses,
            "size": len(self._cache),
            "hit_rate": round(self._hits / max(1, self._hits + self._misses) * 100, 1),
        }

    def log_stats(self):
        """Log cache statistics."""
        stats = self.stats
        logger.info(
            f"Translation cache stats: {stats['hits']} hits, "
            f"{stats['misses']} misses, {stats['size']} cached items, "
            f"{stats['hit_rate']}% hit rate"
        )
