"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function IngestStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["runs", "latest"],
    queryFn: () => api.runs.latest(),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3">
        <p className="text-sm text-red-400">Failed to load ingest status</p>
      </div>
    );
  }

  const statusColor =
    data.status === "success"
      ? "text-emerald-400"
      : data.status === "partial"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Last ingest
          </p>
          <p className={`font-mono text-sm font-medium ${statusColor}`}>
            {data.status}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatDistanceToNow(new Date(data.started_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-4 font-mono text-xs text-zinc-400">
          <span>{data.boards_checked} boards</span>
          <span>{data.jobs_fetched} fetched</span>
          <span className="text-emerald-500/80">+{data.jobs_created} new</span>
          <span className="text-amber-500/80">~{data.jobs_updated} updated</span>
          {data.errors_count > 0 && (
            <span className="text-red-400">{data.errors_count} errors</span>
          )}
        </div>
      </div>
      {data.errors_sample && data.errors_sample.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">
            View errors
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-red-400/90">
            {data.errors_sample.map((err, i) => (
              <li key={i} className="break-all">
                {err}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
