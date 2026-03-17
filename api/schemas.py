from __future__ import annotations

import datetime as dt
import uuid
from typing import Any, Optional

from pydantic import BaseModel, Field
from pydantic.config import ConfigDict


class RunLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_type: str
    status: str
    started_at: dt.datetime
    ended_at: Optional[dt.datetime] = None
    boards_checked: int
    jobs_fetched: int
    jobs_created: int
    jobs_updated: int
    jobs_deactivated: int
    errors_count: int
    errors_sample: list[str] = Field(default_factory=list)


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    domain: Optional[str] = None


class BoardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source_type: str
    token: str
    board_url: str
    api_url: str
    is_active: bool


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    applied_at: Optional[dt.datetime] = None
    last_follow_up_at: Optional[dt.datetime] = None
    next_follow_up_at: Optional[dt.datetime] = None
    notes: Optional[str] = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class ApplicationWithJobOut(ApplicationOut):
    """Application with job title and company for list views."""

    job_title: Optional[str] = None
    company_name: Optional[str] = None
    match_score: Optional[int] = None


class ApplicationUpsertIn(BaseModel):
    status: str = Field(..., description="saved, applied, oa, interview, offer, rejected, no_response")
    applied_at: Optional[dt.datetime] = None
    last_follow_up_at: Optional[dt.datetime] = None
    next_follow_up_at: Optional[dt.datetime] = None
    notes: Optional[str] = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class JobListItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    company_name: str
    location_raw: Optional[str] = None
    is_remote: bool
    match_score: int
    filter_is_uk: bool
    filter_is_entry_level: bool
    filter_is_ai_ml: bool
    last_seen_at: dt.datetime
    updated_at_source: Optional[dt.datetime] = None
    is_active: bool


class JobDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    company: CompanyOut
    board: Optional[BoardOut] = None
    location_raw: Optional[str] = None
    country: Optional[str] = None
    is_remote: bool
    employment_type: Optional[str] = None
    absolute_url: str
    application_url: Optional[str] = None
    content_text: Optional[str] = None
    content_html: Optional[str] = None
    filter_is_uk: bool
    filter_is_entry_level: bool
    filter_is_ai_ml: bool
    filter_reasons: list[str] = Field(default_factory=list)
    match_score: int
    match_reasons: list[str] = Field(default_factory=list)
    updated_at_source: Optional[dt.datetime] = None
    last_seen_at: dt.datetime
    is_active: bool
    application: Optional[ApplicationOut] = None


class Paginated(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int

