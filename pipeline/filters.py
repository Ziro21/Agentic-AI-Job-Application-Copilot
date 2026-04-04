from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List

from config import get_filters


@dataclass
class FilterResult:
    is_uk: bool
    is_entry_level: bool
    is_ai_ml: bool
    reasons: List[str]


def _word_boundary_match(text: str, keywords: List[str]) -> bool:
    """Match keywords using word boundaries to prevent substring false positives."""
    lower = text.lower()
    for kw in keywords:
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, lower):
            return True
    return False


def _build_uk_keywords(cfg: dict) -> List[str]:
    """Build UK location keywords from filters.location (countries, cities, remote)."""
    loc = cfg.get("location", {})
    keywords: List[str] = []
    keywords.extend(loc.get("countries", []))
    keywords.extend(loc.get("cities", []))
    if loc.get("allow_remote", True):
        keywords.extend(loc.get("remote_keywords", []))
    if not keywords:
        keywords = cfg.get("uk_keywords", [])
    return keywords


def apply_filters(title: str, location: str | None, country: str | None, is_remote: bool, content_text: str) -> FilterResult:
    """Apply UK / entry-level / AI-ML filters with balanced matching.
    
    Entry-level logic (3-tier):
      1. If title contains exclude keywords (senior, staff, lead, etc.) → NOT entry-level
      2. If title/body contains entry keywords (junior, graduate, etc.) → IS entry-level
      3. If title has NO seniority marker at all → IS entry-level (implicit)
         A plain "Machine Learning Engineer" without "Senior" is open to entry-level.
    
    AI/ML logic:
      - Checked against title + body, but using word-boundary matching to avoid
        false positives from substring collisions.
    
    UK location logic:
      - Checked against location field and country code.
      - Remote keywords only match in the location field, not the body text.
    """
    cfg = get_filters()
    uk_keywords = _build_uk_keywords(cfg)
    entry_keywords = cfg.get("entry_level_keywords", [])
    ai_keywords = cfg.get("ai_ml_keywords", [])
    exclude_keywords = cfg.get("exclude_keywords", [])

    reasons: List[str] = []

    title_str = title or ""
    location_str = location or ""
    body_str = content_text or ""
    combined = f"{title_str} {body_str}"

    # ── AI/ML check: title + body with word-boundary matching ──
    is_ai_ml = _word_boundary_match(combined, ai_keywords)
    if is_ai_ml:
        reasons.append("Matches AI/ML keywords")

    # ── Entry-level check (3-tier logic) ──
    is_excluded = _word_boundary_match(title_str, exclude_keywords)
    has_entry_keyword = _word_boundary_match(combined, entry_keywords)

    if is_excluded:
        # Tier 1: Explicit senior/staff/lead → reject
        is_entry = False
        reasons.append("Excluded: senior/lead/staff keyword in title")
    elif has_entry_keyword:
        # Tier 2: Explicit junior/graduate → accept
        is_entry = True
        reasons.append("Matches entry-level keywords")
    else:
        # Tier 3: No seniority marker at all → treat as entry-level eligible
        # A plain "Machine Learning Engineer" is open to entry-level candidates
        is_entry = True
        reasons.append("No seniority marker in title (implicitly entry-level eligible)")

    # ── UK location check ──
    # Only check location field for remote keywords, not the full body
    is_uk_text = _word_boundary_match(location_str, uk_keywords)
    is_uk = is_uk_text or country == "UK"
    if is_uk:
        reasons.append("Matches UK location")

    return FilterResult(
        is_uk=is_uk,
        is_entry_level=is_entry,
        is_ai_ml=is_ai_ml,
        reasons=reasons,
    )
