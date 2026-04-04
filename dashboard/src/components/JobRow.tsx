"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { JobListItem } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { FilterBadges } from "./FilterBadges";
import { StatusBadge } from "./StatusBadge";
import { getStatusConfig } from "@/lib/status";

interface JobRowProps {
  job: JobListItem;
  applicationStatus?: string;
}

export function JobRow({ job, applicationStatus }: JobRowProps) {
  const borderColor = applicationStatus
    ? getStatusConfig(applicationStatus).border
    : "border-l-transparent";

  return (
    <Link
      href={`?jobId=${job.id}`}
      shallow
      scroll={false}
      className={`group block cursor-pointer border-b border-zinc-800/50 border-l-2 px-4 py-4 transition-all duration-150 hover:bg-zinc-800/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${borderColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-zinc-100 transition-colors group-hover:text-white">
              {job.title}
            </h2>
            {applicationStatus && <StatusBadge status={applicationStatus} />}
          </div>
          <p className="mt-0.5 font-mono text-sm text-zinc-400">
            {job.company_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ScoreBadge score={job.match_score} />
            <FilterBadges
              isUk={job.filter_is_uk}
              isEntryLevel={job.filter_is_entry_level}
              isAiMl={job.filter_is_ai_ml}
            />
            {job.location_raw && (
              <span className="text-xs text-zinc-400">
                {job.location_raw}
                {job.is_remote && (
                  <span className="ml-1 text-emerald-500/70">· Remote</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-xs text-zinc-400 transition-colors group-hover:text-zinc-300">
            {formatDistanceToNow(new Date(job.last_seen_at), { addSuffix: true })}
          </p>
          {!job.is_active && (
            <p className="mt-1 font-mono text-[10px] text-zinc-500">inactive</p>
          )}
        </div>
      </div>
    </Link>
  );
}
