"use client";

import Link from "next/link";
import { ChevronDown, Clock } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { isBefore, isToday, startOfDay } from "date-fns";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getStatusConfig, ALL_STATUSES } from "@/lib/status";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApplicationWithJob } from "@/lib/types";

interface ApplicationCardProps {
  application: ApplicationWithJob;
  onStatusChange: (newStatus: string) => void;
  isLoading?: boolean;
}

function FollowUpIndicator({ date }: { date: string }) {
  const d = new Date(date);
  const overdue = isBefore(d, startOfDay(new Date()));
  const today = isToday(d);

  return (
    <span title={`Follow-up: ${formatRelativeTime(date)}`}>
      <Clock
        className={cn(
          "h-3 w-3",
          overdue ? "text-red-400" : today ? "text-amber-400" : "text-zinc-600"
        )}
      />
    </span>
  );
}

export function ApplicationCard({
  application: app,
  onStatusChange,
  isLoading,
}: ApplicationCardProps) {
  const config = getStatusConfig(app.status);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group rounded-lg border border-zinc-800/50 bg-zinc-950 p-3 transition-all duration-150",
        "hover:border-zinc-700/50",
        isDragging && "opacity-30"
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <Link
          href={`/jobs/${app.job_id}`}
          className="cursor-pointer text-sm font-medium text-zinc-200 transition-colors hover:text-white line-clamp-1"
          onClick={(e) => e.stopPropagation()}
        >
          {app.job_title ?? "Unknown Job"}
        </Link>
        {app.match_score != null && (
          <ScoreBadge score={app.match_score} size="sm" />
        )}
      </div>

      <p className="mb-2 text-xs text-zinc-500 line-clamp-1">
        {app.company_name ?? "Unknown Company"}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-zinc-600">
            {app.applied_at ? formatRelativeTime(app.applied_at) : "—"}
          </span>
          {app.next_follow_up_at && (
            <FollowUpIndicator date={app.next_follow_up_at} />
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
              config.pill
            )}
          >
            {config.shortLabel}
            <ChevronDown className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ALL_STATUSES.map((status) => {
              const statusConfig = getStatusConfig(status);
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {statusConfig.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
