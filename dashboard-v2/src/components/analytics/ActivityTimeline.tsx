"use client";

import { useMemo } from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ApplicationWithJob, RunLog } from "@/lib/types";

interface TimelineEvent {
  id: string;
  type: "application" | "run";
  timestamp: string;
  description: string;
  dotColor: string;
}

interface ActivityTimelineProps {
  applications: ApplicationWithJob[];
  runs: RunLog[];
}

export function ActivityTimeline({ applications, runs }: ActivityTimelineProps) {
  const events = useMemo(() => {
    const items: TimelineEvent[] = [];

    for (const app of applications.slice(0, 15)) {
      items.push({
        id: `app-${app.id}`,
        type: "application",
        timestamp: app.applied_at ?? new Date().toISOString(),
        description: `${app.status === "saved" ? "Saved" : `Updated to ${app.status}`}: ${app.job_title ?? "Unknown job"} at ${app.company_name ?? "Unknown"}`,
        dotColor:
          app.status === "offer"
            ? "bg-emerald-400"
            : app.status === "rejected"
            ? "bg-zinc-600"
            : "bg-indigo-400",
      });
    }

    for (const run of runs.slice(0, 5)) {
      items.push({
        id: `run-${run.id}`,
        type: "run",
        timestamp: run.started_at,
        description: `Ingest ${run.status}: ${run.jobs_created} new, ${run.jobs_updated} updated`,
        dotColor:
          run.status === "success"
            ? "bg-emerald-400"
            : run.status === "failed"
            ? "bg-red-400"
            : "bg-amber-400",
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items.slice(0, 20);
  }, [applications, runs]);

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-600">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div
          key={event.id}
          className="flex gap-3 py-2.5"
        >
          <div className="flex flex-col items-center">
            <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", event.dotColor)} />
            {i < events.length - 1 && (
              <div className="w-px flex-1 bg-zinc-800/50" />
            )}
          </div>
          <div className="min-w-0 flex-1 pb-2">
            <p className="text-xs text-zinc-400 line-clamp-2">
              {event.description}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
              {formatRelativeTime(event.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
