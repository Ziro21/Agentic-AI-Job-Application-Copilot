import type {
  Application,
  ApplicationWithJob,
  JobDetail,
  JobListItem,
  RunLog,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetchApi<{ status: string }>("/healthz"),

  jobs: {
    list: (params: {
      q?: string;
      min_score?: number;
      is_active?: boolean;
      passed_filters_only?: boolean;
      page?: number;
      page_size?: number;
      sort?: "score_desc" | "recent_desc";
    }) => {
      const search = new URLSearchParams();
      if (params.q) search.set("q", params.q);
      if (params.min_score != null)
        search.set("min_score", String(params.min_score));
      if (params.is_active != null)
        search.set("is_active", String(params.is_active));
      if (params.passed_filters_only)
        search.set("passed_filters_only", "true");
      if (params.page) search.set("page", String(params.page));
      if (params.page_size) search.set("page_size", String(params.page_size));
      if (params.sort) search.set("sort", params.sort);
      return fetchApi<{
        items: JobListItem[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/jobs?${search}`);
    },
    get: (id: string) => fetchApi<JobDetail>(`/api/jobs/${id}`),
    upsertApplication: (
      jobId: string,
      payload: {
        status: string;
        applied_at?: string | null;
        last_follow_up_at?: string | null;
        next_follow_up_at?: string | null;
        notes?: string | null;
        custom_fields?: Record<string, unknown>;
      }
    ) =>
      fetchApi<Application>(`/api/jobs/${jobId}/application`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },

  applications: {
    list: (params?: { status?: string; page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set("status", params.status);
      if (params?.page) search.set("page", String(params.page));
      if (params?.page_size) search.set("page_size", String(params.page_size));
      const qs = search.toString();
      return fetchApi<{
        items: ApplicationWithJob[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/applications${qs ? `?${qs}` : ""}`);
    },
  },

  runs: {
    latest: () => fetchApi<RunLog | null>("/api/runs/latest"),
    list: (params?: { page?: number; page_size?: number }) => {
      const search = new URLSearchParams();
      if (params?.page) search.set("page", String(params.page));
      if (params?.page_size) search.set("page_size", String(params.page_size));
      const qs = search.toString();
      return fetchApi<{
        items: RunLog[];
        total: number;
        page: number;
        page_size: number;
      }>(`/api/runs${qs ? `?${qs}` : ""}`);
    },
  },
};
