import Link from "next/link";
import { MapPin, Clock, Bookmark, ChevronDown } from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { FilterBadge } from "@/components/shared/FilterBadge";
import { StatusBadge } from "@/components/applications/StatusBadge";
import type { JobListItem } from "@/lib/types";

interface JobRowProps {
  job: JobListItem;
  applicationStatus?: string;
  onQuickSave?: (jobId: string) => void;
  onQuickStatusChange?: (jobId: string, status: string) => void;
  isActive?: boolean;
}

export function JobRow({ job, applicationStatus, onQuickSave, onQuickStatusChange, isActive }: JobRowProps) {
  const borderColor = applicationStatus
    ? getStatusConfig(applicationStatus).border
    : "border-l-transparent";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn(
        "group flex cursor-pointer items-center gap-4 border-b border-zinc-800/30 border-l-3 px-4 py-3.5 transition-all duration-150",
        "hover:bg-zinc-900/50",
        isActive && "bg-zinc-900/70 ring-1 ring-indigo-500/40",
        borderColor
      )}
    >
      {/* Company initials */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 font-mono text-[10px] font-bold text-zinc-400">
        {getInitials(job.company_name)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
            {job.title}
          </h3>
          {applicationStatus && <StatusBadge status={applicationStatus} />}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
          <span className="truncate">{job.company_name}</span>
          {job.location_raw && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.location_raw}</span>
            </span>
          )}
          {job.updated_at_source && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(job.updated_at_source)}
            </span>
          )}
        </div>
      </div>

      {/* Quick actions (visible on hover) */}
      {(onQuickSave || onQuickStatusChange) && (
        <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
          {onQuickSave && !applicationStatus && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickSave(job.id); }}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Save job"
              title="Save job"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          )}
          {onQuickStatusChange && applicationStatus && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const next = applicationStatus === "saved" ? "applied" : "interview";
                onQuickStatusChange(job.id, next);
              }}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Advance status"
              title="Advance status"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-1 sm:flex">
          <FilterBadge label="UK" passed={job.filter_is_uk} />
          <FilterBadge label="Entry" passed={job.filter_is_entry_level} />
          <FilterBadge label="AI/ML" passed={job.filter_is_ai_ml} />
        </div>
        <ScoreBadge score={job.match_score} />
      </div>
    </Link>
  );
}
