"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { JobListParams } from "@/lib/types";

export function useJobs(params: JobListParams = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params),
    queryFn: () => api.jobs.list(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => api.jobs.get(id),
    enabled: !!id,
  });
}

export function useJobsCount() {
  return useQuery({
    queryKey: queryKeys.jobs.countAll,
    queryFn: () => api.jobs.list({ page_size: 1 }),
    staleTime: 60_000,
  });
}

export function useMatchedJobsCount() {
  return useQuery({
    queryKey: queryKeys.jobs.countMatched,
    queryFn: () => api.jobs.list({ passed_filters_only: true, page_size: 1 }),
    staleTime: 60_000,
  });
}
