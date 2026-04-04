"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { APPLICATION_STATUSES } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getStatusConfig, PIPELINE_STAGES } from "@/lib/status";

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Fetch all apps for the pipeline summary (unfiltered)
  const { data: allApps } = useQuery({
    queryKey: ["applications-all"],
    queryFn: () => api.applications.list({ page_size: 200 }),
    staleTime: 30_000,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["applications", statusFilter, page],
    queryFn: () =>
      api.applications.list({
        status: statusFilter || undefined,
        page,
        page_size: 25,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      api.jobs.upsertApplication(jobId, {
        status,
        applied_at: status === "applied" ? new Date().toISOString() : undefined,
      }),
    onMutate: async ({ jobId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["applications", statusFilter, page] });
      
      const previousData = queryClient.getQueryData(["applications", statusFilter, page]);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["applications", statusFilter, page], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: old.items.map((app: any) => app.job_id === jobId ? { ...app, status } : app)
        };
      });
      return { previousData };
    },
    onError: (err, vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["applications", statusFilter, page], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications-all"] });
      queryClient.invalidateQueries({ queryKey: ["applications-count"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  // Pipeline counts for the summary strip
  const pipelineCounts = useMemo(() => {
    const items = allApps?.items ?? [];
    return Object.fromEntries(
      APPLICATION_STATUSES.map((s) => [s, items.filter((a) => a.status === s).length]),
    );
  }, [allApps]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Applications</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Track your job application pipeline</p>
      </div>

      {/* Pipeline summary */}
      {allApps && (
        <div className="mb-6 flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const cfg = getStatusConfig(stage);
            const count = pipelineCounts[stage] ?? 0;
            return (
              <div
                key={stage}
                className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2"
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-zinc-400">{cfg.label}</span>
                <span className="font-mono text-xs font-semibold text-zinc-300">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <button
          onClick={() => { setStatusFilter(""); setPage(1); }}
          className={`cursor-pointer rounded px-3 py-1.5 text-sm transition-colors ${
            !statusFilter
              ? "bg-zinc-700 text-white"
              : "border border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
          }`}
        >
          All
        </button>
        {APPLICATION_STATUSES.map((s) => {
          const cfg = getStatusConfig(s);
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`cursor-pointer rounded px-3 py-1.5 text-sm transition-colors ${
                statusFilter === s
                  ? cfg.pill
                  : "border border-zinc-700/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-px">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-zinc-900/60" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-6">
          <p className="text-sm text-red-400">Failed to load applications</p>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <p className="text-sm text-zinc-400">No applications yet.</p>
          <p className="mt-2 font-mono text-xs text-zinc-600">
            Save or apply to jobs from the Jobs page.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-zinc-800/60 bg-zinc-900/30">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Job / Company
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                    Applied
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-zinc-800/40 transition-colors hover:bg-zinc-800/20"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="cursor-pointer font-medium text-zinc-200 transition-colors hover:text-white"
                      >
                        {app.job_title || "—"}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-zinc-600">
                        {app.company_name || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {app.match_score != null ? (
                        <ScoreBadge score={app.match_score} />
                      ) : (
                        <span className="font-mono text-xs text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={app.status} />
                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateStatus.mutate({
                              jobId: app.job_id,
                              status: e.target.value,
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="cursor-pointer rounded border border-zinc-700/50 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-400 focus:border-indigo-500/40 focus:outline-none disabled:cursor-not-allowed"
                        >
                          {APPLICATION_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {getStatusConfig(s).label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {app.applied_at
                        ? format(new Date(app.applied_at), "PP")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="font-mono text-xs text-zinc-600">
                {data?.total} total · page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
