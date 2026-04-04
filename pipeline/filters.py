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
    """Match keywords using word boundaries to prevent substring false positives.
    
    e.g. 'nlp' will NOT match 'onlpremise', but WILL match 'NLP Engineer'.
    """
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
    # Fallback for legacy config with flat uk_keywords
    if not keywords:
        keywords = cfg.get("uk_keywords", [])
    return keywords


def apply_filters(title: str, location: str | None, country: str | None, is_remote: bool, content_text: str) -> FilterResult:
    """Apply UK / entry-level / AI-ML filters with strict word-boundary matching.
    
    Key rules:
    - AI/ML keywords are checked against the TITLE only (not the full body text)
      to prevent false positives from generic mentions like "we use data" in descriptions.
    - Entry-level keywords are checked against title + body (since seniority is often
      mentioned in the description but not the title).
    - Exclude keywords ACTUALLY DISQUALIFY the job — if a senior/lead keyword is found,
      the job will NOT pass the entry-level filter.
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
    
    # For AI/ML: match against title ONLY to prevent false positives
    # A job titled "Software Engineer" that happens to mention "data" in the
    # description is NOT an AI/ML role.
    is_ai_ml = _word_boundary_match(title_str, ai_keywords)
    if is_ai_ml:
        reasons.append("Title matches AI/ML keywords")

    # For entry-level: match against title + body (seniority is often in the body)
    combined_for_seniority = f"{title_str} {body_str}"
    is_entry = _word_boundary_match(combined_for_seniority, entry_keywords)
    
    # Exclusion ACTUALLY DISQUALIFIES — if "senior", "lead", etc. found in title,
    # this job is NOT entry-level regardless of other keywords
    is_excluded = _word_boundary_match(title_str, exclude_keywords)
    if is_excluded:
        is_entry = False
        reasons.append("Excluded: senior/lead/manager keyword found in title")
    elif is_entry:
        reasons.append("Matches entry-level keywords")

    # UK location check
    is_uk_text = _word_boundary_match(location_str, uk_keywords)
    is_uk = is_uk_text or country == "UK"
    if is_uk:
        reasons.append("Matches UK location keywords or country logic")

    return FilterResult(
        is_uk=is_uk,
        is_entry_level=is_entry,
        is_ai_ml=is_ai_ml,
        reasons=reasons,
    )
