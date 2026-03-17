// API response types matching FastAPI schemas

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface JobListItem {
  id: string;
  title: string;
  company_name: string;
  location_raw: string | null;
  is_remote: boolean;
  match_score: number;
  filter_is_uk: boolean;
  filter_is_entry_level: boolean;
  filter_is_ai_ml: boolean;
  last_seen_at: string;
  updated_at_source: string | null;
  is_active: boolean;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
}

export interface Board {
  id: string;
  source_type: string;
  token: string;
  board_url: string;
  api_url: string;
  is_active: boolean;
}

export interface Application {
  id: string;
  job_id: string;
  status: string;
  applied_at: string | null;
  last_follow_up_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
}

export interface ApplicationWithJob extends Application {
  job_title: string | null;
  company_name: string | null;
  match_score: number | null;
}

export interface JobDetail {
  id: string;
  title: string;
  company: Company;
  board: Board | null;
  location_raw: string | null;
  country: string | null;
  is_remote: boolean;
  employment_type: string | null;
  absolute_url: string;
  application_url: string | null;
  content_text: string | null;
  content_html: string | null;
  filter_is_uk: boolean;
  filter_is_entry_level: boolean;
  filter_is_ai_ml: boolean;
  filter_reasons: string[];
  match_score: number;
  match_reasons: string[];
  updated_at_source: string | null;
  last_seen_at: string;
  is_active: boolean;
  application: Application | null;
}

export interface RunLog {
  id: string;
  run_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  boards_checked: number;
  jobs_fetched: number;
  jobs_created: number;
  jobs_updated: number;
  jobs_deactivated: number;
  errors_count: number;
  errors_sample: string[];
}

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "oa",
  "interview",
  "offer",
  "rejected",
  "no_response",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
