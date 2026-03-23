import Link from "next/link";
import { MapPin, Bookmark, ChevronDown } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { FilterBadge } from "@/components/shared/FilterBadge";
import { StatusBadge } from "@/components/applications/StatusBadge";
import type { JobListItem } from "@/lib/types";

interface JobCardProps {
  job: JobListItem;
  applicationStatus?: string;
  onQuickSave?: (jobId: string) => void;
  onQuickStatusChange?: (jobId: string, status: string) => void;
}

export function JobCard({ job, applicationStatus, onQuickSave, onQuickStatusChange }: JobCardProps) {
  const borderColor = applicationStatus
    ? getStatusConfig(applicationStatus).column
    : "";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 transition-all duration-150",
        "hover:border-zinc-700/50 hover:bg-zinc-900/40",
        borderColor && `border-t-2 ${borderColor}`
      )}
    >
      {/* Score ring top right */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {/* Quick actions (visible on hover) */}
        {onQuickSave && !applicationStatus && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickSave(job.id); }}
            className="hidden rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 group-hover:block"
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
            className="hidden rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 group-hover:block"
            aria-label="Advance status"
            title="Advance status"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        <ScoreBadge score={job.match_score} />
      </div>

      {/* Company initials + name */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">
          {getInitials(job.company_name)}
        </div>
        <span className="truncate text-xs text-zinc-500">{job.company_name}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1 pr-10 text-sm font-medium text-zinc-200 group-hover:text-white line-clamp-1">
        {job.title}
      </h3>

      {/* Location */}
      {job.location_raw && (
        <p className="mb-3 flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{job.location_raw}</span>
        </p>
      )}

      {/* Status + Filters */}
      <div className="mt-auto flex items-center gap-1.5 pt-2">
        {applicationStatus && <StatusBadge status={applicationStatus} />}
        <div className="ml-auto flex gap-1">
          <FilterBadge label="UK" passed={job.filter_is_uk} />
          <FilterBadge label="Entry" passed={job.filter_is_entry_level} />
          <FilterBadge label="AI" passed={job.filter_is_ai_ml} />
        </div>
      </div>
    </Link>
  );
}
