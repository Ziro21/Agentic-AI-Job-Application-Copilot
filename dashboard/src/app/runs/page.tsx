"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";

export default function RunsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.runs.list({ page_size: 30 }),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-8 text-xl font-semibold text-white">Ingest Runs</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded bg-zinc-800/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <p className="text-red-400">Failed to load runs</p>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">No runs yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Run the Greenhouse collector to see run history.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Started
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Boards
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Fetched
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((run) => (
                <tr
                  key={run.id}
                  className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                >
                  <td className="px-4 py-3 font-mono text-sm text-zinc-400">
                    {format(new Date(run.started_at), "PPp")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono text-sm ${
                        run.status === "success"
                          ? "text-emerald-400"
                          : run.status === "partial"
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-zinc-400">
                    {run.boards_checked}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-zinc-400">
                    {run.jobs_fetched}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-emerald-500/80">
                    {run.jobs_created}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-amber-500/80">
                    {run.jobs_updated}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {run.errors_count > 0 ? (
                      <span className="text-red-400">{run.errors_count}</span>
                    ) : (
                      <span className="text-zinc-500">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
