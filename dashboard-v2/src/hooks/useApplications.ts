"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApplicationListParams, ApplicationUpsertPayload } from "@/lib/types";

export function useApplications(params?: ApplicationListParams) {
  return useQuery({
    queryKey: queryKeys.applications.list(params),
    queryFn: () => api.applications.list(params),
  });
}

export function useAllApplications() {
  return useQuery({
    queryKey: queryKeys.applications.listAll,
    queryFn: () => api.applications.list({ page_size: 200 }),
    staleTime: 10_000,
  });
}

export function useUpsertApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      payload,
    }: {
      jobId: string;
      payload: ApplicationUpsertPayload;
    }) => api.applications.upsert(jobId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
