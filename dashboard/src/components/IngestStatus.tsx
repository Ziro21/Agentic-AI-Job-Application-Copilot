"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

function Stat({
  label,
  value,
  color = "text-zinc-400",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="text-center">
      <p className={`font-mono text-sm font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>
    </div>
  );
}

export function IngestStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["runs", "latest"],
    queryFn: () => api.runs.latest(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3">
        <p className="font-mono text-xs text-red-400">
          No ingest data — run the collector first
        </p>
      </div>
    );
  }

  const statusColor =
    data.status === "success"
      ? "text-emerald-400"
      : data.status === "partial"
        ? "text-amber-400"
        : "text-red-400";

  const statusDot =
    data.status === "success"
      ? "bg-emerald-500"
      : data.status === "partial"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-3.5" aria-live="polite">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <p
              className={`font-mono text-xs font-semibold uppercase tracking-wider ${statusColor}`}
            >
              {data.status}
            </p>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
            {formatDistanceToNow(new Date(data.started_at), { addSuffix: true })}
          </p>
        </div>

        <div className="h-6 w-px bg-zinc-800" />

        <div className="flex gap-6">
          <Stat label="Boards" value={data.boards_checked} />
          <Stat label="Fetched" value={data.jobs_fetched} />
          <Stat label="New" value={`+${data.jobs_created}`} color="text-emerald-400" />
          <Stat label="Updated" value={data.jobs_updated} />
          {data.errors_count > 0 && (
            <Stat label="Errors" value={data.errors_count} color="text-red-400" />
          )}
        </div>
      </div>

      {data.errors_sample && data.errors_sample.length > 0 && (
        <details className="mt-3 border-t border-zinc-800 pt-3">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-500">
            {data.errors_count} error{data.errors_count > 1 ? "s" : ""} — view details
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-red-400/80">
            {data.errors_sample.map((err, i) => (
              <li key={i} className="break-all">
                · {err}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
