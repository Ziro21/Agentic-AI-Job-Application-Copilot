"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ApplicationWithJob } from "@/lib/types";

interface FollowUpWidgetProps {
  overdue: ApplicationWithJob[];
  dueToday: ApplicationWithJob[];
  upcoming: ApplicationWithJob[];
}

function FollowUpItem({
  app,
  variant,
}: {
  app: ApplicationWithJob;
  variant: "overdue" | "today" | "upcoming";
}) {
  const dotColor =
    variant === "overdue"
      ? "bg-red-400"
      : variant === "today"
        ? "bg-amber-400"
        : "bg-indigo-400";

  return (
    <Link
      href={`/jobs/${app.job_id}`}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-zinc-800/50"
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotColor)} />
      <span className="min-w-0 flex-1 truncate text-zinc-400">
        {app.job_title ?? app.company_name ?? "Job"}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-zinc-600">
        {app.next_follow_up_at
          ? formatRelativeTime(app.next_follow_up_at)
          : ""}
      </span>
    </Link>
  );
}

export function FollowUpWidget({
  overdue,
  dueToday,
  upcoming,
}: FollowUpWidgetProps) {
  const all = [
    ...overdue.map((a) => ({ app: a, variant: "overdue" as const })),
    ...dueToday.map((a) => ({ app: a, variant: "today" as const })),
    ...upcoming.map((a) => ({ app: a, variant: "upcoming" as const })),
  ].slice(0, 5);

  if (all.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-2">
      <div className="mb-1 flex items-center gap-1.5 px-2 py-1">
        <Clock className="h-3 w-3 text-zinc-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Follow-ups
        </span>
        {overdue.length > 0 && (
          <span className="ml-auto rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
            {overdue.length}
          </span>
        )}
      </div>
      <div className="space-y-0">
        {all.map(({ app, variant }) => (
          <FollowUpItem key={app.id} app={app} variant={variant} />
        ))}
      </div>
    </div>
  );
}
