from __future__ import annotations

from dataclasses import dataclass
from typing import List

from config import get_filters, load_settings_yaml


@dataclass
class ScoreResult:
    score: int
    reasons: List[str]


def compute_score(title: str, location: str | None, content_text: str) -> ScoreResult:
    """Compute a 0–100 match score and explanation for a job."""
    settings = load_settings_yaml()
    scoring_cfg = settings.get("scoring", {})
    user_prefs = settings.get("user_preferences", {})

    reasons: List[str] = []

    text = (content_text or "").lower()
    title_lower = (title or "").lower()
    location_lower = (location or "").lower()

    # Base: simple skill overlap using AI/ML keywords
    filters_cfg = get_filters()
    skills = filters_cfg.get("ai_ml_keywords", [])
    if not skills:
        base_score = 0
    else:
        matched = [s for s in skills if s.lower() in text]
        base_weight = scoring_cfg.get("skill_overlap_base", 60)
        base_score = int(len(matched) / max(len(skills), 1) * base_weight)
        if matched:
            reasons.append(f"{len(matched)}/{len(skills)} AI/ML keywords matched")

    score = base_score

    # Priority skills
    priority = scoring_cfg.get("priority_skills", {})

    def add_if(keyword: str, key_name: str) -> None:
        nonlocal score
        weight = priority.get(key_name, 0)
        if weight and keyword.lower() in text:
            score += weight
            reasons.append(f"{keyword} present (+{weight})")

    add_if("python", "python")
    add_if("tensorflow", "tensorflow")
    add_if("pytorch", "pytorch")
    add_if("scikit-learn", "scikit_learn")
    add_if("sql", "sql")
    for cloud_kw, key in [("aws", "aws"), ("gcp", "gcp"), ("azure", "azure")]:
        add_if(cloud_kw, key)

    # Role-type match (title)
    role_types = user_prefs.get("role_types", [])
    role_weight = scoring_cfg.get("role_type_match", 15)
    if any(rt.lower() in title_lower for rt in role_types):
        score += role_weight
        reasons.append(f"Title matches target role types (+{role_weight})")

    # Data Quality penalty
    if len(text) < 100:
        penalty = 20
        score -= penalty
        reasons.append(f"Red flag: Unusually short or missing job description (-{penalty})")

    # Seniority penalty
    senior_terms = ["senior", "staff", "principal", "lead", "manager", "head of"]
    if any(term in title_lower or term in text for term in senior_terms):
        penalty = scoring_cfg.get("seniority_penalty", -20)
        score += penalty
        reasons.append(f"Senior-level terms detected ({penalty})")

    # Entry-level bonus
    entry_keywords = filters_cfg.get("entry_level_keywords", [])
    if any(kw.lower() in text for kw in entry_keywords):
        bonus = scoring_cfg.get("entry_level_bonus", 10)
        score += bonus
        reasons.append(f"Entry-level keywords present (+{bonus})")

    # Location bonus
    target_location = user_prefs.get("target_location", "")
    if target_location and target_location.lower() in (location_lower or ""):
        loc_bonus = scoring_cfg.get("location_bonus", 5)
        score += loc_bonus
        reasons.append(f"Location matches target ({target_location}) (+{loc_bonus})")

    # Clamp to 0–100
    score = max(0, min(100, score))
    return ScoreResult(score=score, reasons=reasons)

