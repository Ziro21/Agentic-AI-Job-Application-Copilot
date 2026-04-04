"""Deduplication keys and content hashing for jobs (Phase 2)."""

from __future__ import annotations

import hashlib
import re
import uuid


def normalize_text_for_content_hash(text: str | None) -> str:
    """Normalize plain text before hashing (whitespace, case)."""
    if not text:
        return ""
    s = text.strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def compute_content_hash(normalized_content_text: str) -> str | None:
    """SHA-256 hex of normalized content; None if empty."""
    if not normalized_content_text:
        return None
    return hashlib.sha256(normalized_content_text.encode("utf-8")).hexdigest()


def compute_dedupe_key_secondary(
    company_id: uuid.UUID,
    title_normalized: str,
    location_normalized: str | None,
) -> str:
    """Stable secondary key: same company + title + location → same hash (cross-URL dedupe)."""
    title = (title_normalized or "").strip().lower()
    loc = (location_normalized or "").strip().lower()
    raw = f"{company_id}|{title}|{loc}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
