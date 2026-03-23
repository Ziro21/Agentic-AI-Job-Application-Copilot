"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface IngestStatusProps {
  variant?: "compact" | "full";
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        status === "success" && "bg-emerald-400",
        status === "partial" && "bg-amber-400",
        status === "failed" && "bg-red-400",
        !["success", "partial", "failed"].includes(status) && "bg-zinc-500"
      )}
    />
  );
}

export function IngestStatus({ variant = "compact" }: IngestStatusProps) {
  const { data: run, isLoading } = useQuery({
    queryKey: queryKeys.runs.latest,
    queryFn: () => api.runs.latest(),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <Skeleton className={variant === "compact" ? "h-16 w-full" : "h-28 w-full"} />;
  }

  if (!run) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500">
        <Activity className="h-3.5 w-3.5" />
        No runs yet
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-950 px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          <StatusDot status={run.status} />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {run.status}
          </span>
        </div>
        <div className="flex items-baseline gap-3 text-[10px] text-zinc-500">
          <span>{run.jobs_created} new</span>
          <span>{run.jobs_updated} upd</span>
          <span className="ml-auto">{formatRelativeTime(run.started_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
      <div className="mb-4 flex items-center gap-3">
        <StatusDot status={run.status} />
        <span className="font-mono text-sm font-semibold uppercase tracking-wider text-zinc-300">
          {run.status}
        </span>
        <span className="ml-auto font-mono text-xs text-zinc-500">
          {formatRelativeTime(run.started_at)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Boards", value: run.boards_checked },
          { label: "Fetched", value: run.jobs_fetched },
          { label: "New", value: run.jobs_created },
          { label: "Updated", value: run.jobs_updated },
        ].map((stat) => (
          <div key={stat.label}>
            <div className="font-mono text-lg font-bold text-zinc-200">
              {stat.value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {run.errors_count > 0 && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <div className="mb-1 flex items-center gap-1.5 text-xs text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {run.errors_count} error{run.errors_count > 1 ? "s" : ""}
          </div>
          {run.errors_sample.length > 0 && (
            <div className="space-y-0.5">
              {run.errors_sample.slice(0, 3).map((err, i) => (
                <p key={i} className="truncate font-mono text-[10px] text-red-400/70">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
