from __future__ import annotations

from dataclasses import dataclass
from typing import List

from config import get_filters


@dataclass
class FilterResult:
    is_uk: bool
    is_entry_level: bool
    is_ai_ml: bool
    reasons: List[str]


def _contains_any(text: str, keywords: List[str]) -> bool:
    lower = text.lower()
    return any(kw.lower() in lower for kw in keywords)


def _build_uk_keywords(cfg: dict) -> List[str]:
    """Build UK location keywords from filters.location (countries, cities, remote)."""
    loc = cfg.get("location", {})
    keywords: List[str] = []
    keywords.extend(loc.get("countries", []))
    keywords.extend(loc.get("cities", []))
    if loc.get("allow_remote", True):
        keywords.extend(loc.get("remote_keywords", []))
    # Fallback for legacy config with flat uk_keywords
    if not keywords:
        keywords = cfg.get("uk_keywords", [])
    return keywords


def apply_filters(title: str, location: str | None, country: str | None, is_remote: bool, content_text: str) -> FilterResult:
    """Apply UK / entry-level / AI-ML filters and produce human-readable reasons, leveraging structured location data."""
    cfg = get_filters()
    uk_keywords = _build_uk_keywords(cfg)
    entry_keywords = cfg.get("entry_level_keywords", [])
    ai_keywords = cfg.get("ai_ml_keywords", [])
    exclude_keywords = cfg.get("exclude_keywords", [])

    reasons: List[str] = []

    combined = " ".join(
        part for part in [title or "", location or "", content_text or ""] if part
    )

    is_excluded = _contains_any(combined, exclude_keywords)
    if is_excluded:
        reasons.append("Excluded senior/lead/manager keywords present")

    is_uk_text = _contains_any(location or "", uk_keywords) or _contains_any(combined, uk_keywords)
    is_uk = is_uk_text or country == "UK"
    
    if is_uk:
        reasons.append("Matches UK location keywords or country logic")

    is_entry = _contains_any(combined, entry_keywords)
    if is_entry:
        reasons.append("Matches entry-level keywords")

    is_ai_ml = _contains_any(combined, ai_keywords)
    if is_ai_ml:
        reasons.append("Matches AI/ML keywords")

    return FilterResult(
        is_uk=is_uk,
        is_entry_level=is_entry,
        is_ai_ml=is_ai_ml,
        reasons=reasons,
    )

