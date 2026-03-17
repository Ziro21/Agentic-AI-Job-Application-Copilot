"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { APPLICATION_STATUSES } from "@/lib/types";

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

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
    mutationFn: ({
      jobId,
      status,
    }: {
      jobId: string;
      status: string;
    }) =>
      api.jobs.upsertApplication(jobId, {
        status,
        applied_at:
          status === "applied" ? new Date().toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-8 text-xl font-semibold text-white">Applications</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded px-3 py-1.5 text-sm ${
            !statusFilter
              ? "bg-zinc-600 text-white"
              : "border border-zinc-600 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          All
        </button>
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded px-3 py-1.5 text-sm ${
              statusFilter === s
                ? "bg-zinc-600 text-white"
                : "border border-zinc-600 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded bg-zinc-800/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <p className="text-red-400">Failed to load applications</p>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">No applications yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Save or apply to jobs from the Jobs page.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-700/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Job / Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Applied
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="font-medium text-zinc-100 hover:text-white"
                      >
                        {app.job_title || "—"}
                      </Link>
                      <p className="font-mono text-xs text-zinc-500">
                        {app.company_name || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={app.status}
                        onChange={(e) =>
                          updateStatus.mutate({
                            jobId: app.job_id,
                            status: e.target.value,
                          })
                        }
                        disabled={updateStatus.isPending}
                        className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 font-mono text-sm text-zinc-300 focus:border-zinc-500 focus:outline-none"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
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
              <p className="font-mono text-sm text-zinc-500">
                {data?.total} total • page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
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
