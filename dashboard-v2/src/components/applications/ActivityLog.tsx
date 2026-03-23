"use client";

import { formatRelativeTime } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status";
import type { ActivityLogEntry } from "@/lib/types";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
}

function getEntryColor(entry: ActivityLogEntry): string {
  if (entry.to_status) return getStatusConfig(entry.to_status).dot;
  if (entry.action === "note_added") return "bg-zinc-500";
  if (entry.action === "follow_up_set") return "bg-amber-400";
  return "bg-indigo-400";
}

function getEntryText(entry: ActivityLogEntry): string {
  switch (entry.action) {
    case "status_change":
      if (entry.from_status && entry.to_status) {
        const from = getStatusConfig(entry.from_status).label;
        const to = getStatusConfig(entry.to_status).label;
        return `Status changed from ${from} to ${to}`;
      }
      if (entry.to_status) {
        return `Status set to ${getStatusConfig(entry.to_status).label}`;
      }
      return "Status changed";
    case "saved":
      return "Job saved to tracker";
    case "note_added":
      return entry.detail ?? "Notes updated";
    case "follow_up_set":
      return entry.detail ?? "Follow-up date set";
    default:
      return "Activity recorded";
  }
}

export function ActivityLog({ entries }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-zinc-600">
        No activity recorded yet
      </p>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-0">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Activity
      </h3>
      <div className="relative space-y-3 pl-5">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-zinc-800/50" />
        {sorted.map((entry, i) => (
          <div key={i} className="relative flex items-start gap-3">
            <div
              className={`absolute left-[-13px] top-1.5 h-2 w-2 rounded-full ${getEntryColor(entry)}`}
            />
            <div className="flex-1">
              <p className="text-xs text-zinc-400">{getEntryText(entry)}</p>
              <p className="font-mono text-[10px] text-zinc-600">
                {formatRelativeTime(entry.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
