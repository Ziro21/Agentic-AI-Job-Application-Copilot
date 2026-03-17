"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { JobListItem } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";
import { FilterBadges } from "./FilterBadges";

interface JobRowProps {
  job: JobListItem;
}

export function JobRow({ job }: JobRowProps) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block border-b border-zinc-800/50 py-4 transition-colors hover:bg-zinc-800/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-zinc-100 group-hover:text-white">
            {job.title}
          </h3>
          <p className="mt-0.5 font-mono text-sm text-zinc-500">
            {job.company_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ScoreBadge score={job.match_score} />
            <FilterBadges
              isUk={job.filter_is_uk}
              isEntryLevel={job.filter_is_entry_level}
              isAiMl={job.filter_is_ai_ml}
            />
            {job.location_raw && (
              <span className="text-xs text-zinc-500">
                {job.location_raw}
                {job.is_remote && (
                  <span className="ml-1 text-emerald-500/80">Remote</span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-xs text-zinc-500">
            {formatDistanceToNow(new Date(job.last_seen_at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
}
