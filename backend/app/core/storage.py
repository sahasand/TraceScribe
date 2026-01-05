"""Local filesystem storage for clinical trial documents.

Provides secure local storage instead of cloud storage for
data sovereignty and compliance (HIPAA, GxP, 21 CFR Part 11).
"""

import os
import uuid
import aiofiles
import aiofiles.os
from pathlib import Path
from typing import Optional
from loguru import logger

from .config import settings


class LocalStorage:
    """Local filesystem storage client."""

    def __init__(self):
        self.base_path = Path(settings.storage_path)
        self._ensure_base_path()

    def _ensure_base_path(self):
        """Create base storage directory if it doesn't exist."""
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _get_full_path(self, key: str) -> Path:
        """Convert storage key to full filesystem path."""
        return self.base_path / key

    async def upload_file(
        self,
        file_data: bytes,
        file_name: str,
        content_type: str = "application/octet-stream",
        folder: Optional[str] = None,
    ) -> str:
        """
        Upload a file to local storage.

        Args:
            file_data: File content as bytes
            file_name: Original filename
            content_type: MIME type (stored in metadata if needed)
            folder: Optional folder prefix

        Returns:
            Storage path (key)
        """
        # Generate unique key
        unique_id = uuid.uuid4().hex[:8]
        key = f"{folder}/{unique_id}_{file_name}" if folder else f"{unique_id}_{file_name}"

        # Get full path and ensure directory exists
        full_path = self._get_full_path(key)
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file asynchronously
        async with aiofiles.open(full_path, "wb") as f:
            await f.write(file_data)
            await f.flush()  # Flush Python buffers

            # Force OS-level flush on Windows (critical for Word documents)
            if hasattr(os, 'fsync'):
                try:
                    os.fsync(f.fileno())
                except Exception as e:
                    logger.warning(f"OS fsync failed: {e}")

        # Verify file was written correctly
        if not full_path.exists():
            raise IOError(f"File was not created: {full_path}")

        file_size = full_path.stat().st_size
        expected_size = len(file_data)
        if file_size != expected_size:
            raise IOError(f"File size mismatch: expected {expected_size}, got {file_size}")

        logger.info(f"File uploaded and verified: {key} ({file_size} bytes)")

        return key

    async def download_file(self, key: str) -> bytes:
        """
        Download a file from local storage.

        Args:
            key: Storage path (key)

        Returns:
            File content as bytes
        """
        full_path = self._get_full_path(key)

        if not full_path.exists():
            raise FileNotFoundError(f"File not found: {key}")

        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()

    async def delete_file(self, key: str) -> None:
        """
        Delete a file from local storage.

        Args:
            key: Storage path (key)
        """
        full_path = self._get_full_path(key)

        if full_path.exists():
            await aiofiles.os.remove(full_path)

    async def get_presigned_url(
        self,
        key: str,
        expires_in: int = 3600,
        download_filename: Optional[str] = None,
    ) -> str:
        """
        Generate a download URL for local files.

        For local storage, returns an API endpoint path.
        The actual file serving is handled by the documents router.

        Args:
            key: Storage path (key)
            expires_in: Ignored for local storage
            download_filename: Ignored for local storage

        Returns:
            API endpoint path for downloading
        """
        # Return API endpoint - actual auth is handled by the router
        return f"/api/files/{key}"

    async def file_exists(self, key: str) -> bool:
        """
        Check if a file exists in local storage.

        Args:
            key: Storage path (key)

        Returns:
            True if file exists
        """
        full_path = self._get_full_path(key)
        return full_path.exists()


# Global storage instance
storage = LocalStorage()
