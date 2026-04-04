"""Unit tests for dedupe keys and content hashing."""

from __future__ import annotations

import uuid

from pipeline.dedupe import (
    compute_content_hash,
    compute_dedupe_key_secondary,
    normalize_text_for_content_hash,
)


def test_normalize_text_for_content_hash_collapses_whitespace() -> None:
    assert normalize_text_for_content_hash("  Hello   \nWorld  ") == "hello world"


def test_compute_content_hash_empty() -> None:
    assert compute_content_hash("") is None
    assert compute_content_hash(normalize_text_for_content_hash("")) is None


def test_compute_content_hash_stable() -> None:
    h = compute_content_hash(normalize_text_for_content_hash("Same text"))
    assert h is not None
    assert len(h) == 64
    assert h == compute_content_hash(normalize_text_for_content_hash("Same text"))


def test_dedupe_key_secondary_stable_per_company_title_location() -> None:
    cid = uuid.uuid4()
    k1 = compute_dedupe_key_secondary(cid, "engineer", "london")
    k2 = compute_dedupe_key_secondary(cid, "engineer", "london")
    assert k1 == k2
    k3 = compute_dedupe_key_secondary(cid, "engineer", "manchester")
    assert k1 != k3


def test_dedupe_key_secondary_differs_by_company() -> None:
    a = uuid.uuid4()
    b = uuid.uuid4()
    assert compute_dedupe_key_secondary(a, "x", "y") != compute_dedupe_key_secondary(b, "x", "y")
