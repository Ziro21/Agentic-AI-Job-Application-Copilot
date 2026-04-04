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


def _is_uk_location(location: str | None, country: str | None) -> tuple[bool, str]:
    """Determine if a job is UK-based using strict location logic.
    
    Rules:
    1. Explicit country code "UK" → yes
    2. Location string contains a UK country name or city → yes
    3. Location string contains UK-specific remote patterns like 
       "Remote - UK", "UK Remote", "Remote (UK)" → yes
    4. A bare "Remote" or "Hybrid" with NO UK context → NO (could be anywhere)
    
    Returns (is_uk, reason_string).
    """
    if country == "UK":
        return True, "Country code is UK"
    
    loc = location or ""
    loc_lower = loc.lower()
    
    # If location is empty, not UK
    if not loc_lower.strip():
        return False, ""
    
    # Direct UK country/region names
    uk_place_keywords = [
        "united kingdom", "england", "scotland", "wales", "northern ireland",
        "london", "cambridge", "oxford", "manchester", "bristol",
        "edinburgh", "birmingham", "leeds", "glasgow", "belfast",
        "nottingham", "sheffield", "liverpool", "cardiff", "newcastle",
        ", uk", " uk,", " uk ", "(uk)", "uk -", "- uk",
    ]
    
    for kw in uk_place_keywords:
        if kw in loc_lower:
            return True, f"Location contains '{kw}'"
    
    # Check if location starts or ends with "UK"
    loc_stripped = loc_lower.strip().rstrip(".")
    if loc_stripped == "uk" or loc_stripped.startswith("uk ") or loc_stripped.endswith(" uk"):
        return True, "Location is UK"
    
    return False, ""


def apply_filters(title: str, location: str | None, country: str | None, is_remote: bool, content_text: str) -> FilterResult:
    """Apply UK / entry-level / AI-ML filters with balanced, accurate matching.
    
    Entry-level logic (3-tier):
      1. If title contains exclude keywords (senior, staff, lead, etc.) → NOT entry-level
      2. If title/body contains entry keywords (junior, graduate, etc.) → IS entry-level
      3. If title has NO seniority marker at all → IS entry-level (implicit)
    
    AI/ML logic:
      - Checked against title + body with word-boundary matching.
    
    UK location logic:
      - Strict: requires explicit UK place name or country code.
      - Bare "Remote" or "Hybrid" without UK context does NOT pass.
    """
    cfg = get_filters()
    entry_keywords = cfg.get("entry_level_keywords", [])
    ai_keywords = cfg.get("ai_ml_keywords", [])
    exclude_keywords = cfg.get("exclude_keywords", [])

    reasons: List[str] = []

    title_str = title or ""
    body_str = content_text or ""
    combined = f"{title_str} {body_str}"

    # ── AI/ML check ──
    is_ai_ml = _word_boundary_match(combined, ai_keywords)
    if is_ai_ml:
        reasons.append("Matches AI/ML keywords")

    # ── Entry-level check (3-tier) ──
    is_excluded = _word_boundary_match(title_str, exclude_keywords)
    has_entry_keyword = _word_boundary_match(combined, entry_keywords)

    if is_excluded:
        is_entry = False
        reasons.append("Excluded: senior/lead/staff keyword in title")
    elif has_entry_keyword:
        is_entry = True
        reasons.append("Matches entry-level keywords")
    else:
        is_entry = True
        reasons.append("No seniority marker (implicitly entry-level eligible)")

    # ── UK location check (strict) ──
    is_uk, uk_reason = _is_uk_location(location, country)
    if is_uk:
        reasons.append(uk_reason)

    return FilterResult(
        is_uk=is_uk,
        is_entry_level=is_entry,
        is_ai_ml=is_ai_ml,
        reasons=reasons,
    )
