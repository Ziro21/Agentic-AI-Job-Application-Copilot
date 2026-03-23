import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { ApplicationWithJob } from "@/lib/types";

interface DragOverlayCardProps {
  application: ApplicationWithJob;
}

export function DragOverlayCard({ application: app }: DragOverlayCardProps) {
  const config = getStatusConfig(app.status);

  return (
    <div
      className={cn(
        "w-72 rounded-lg border border-indigo-500/20 bg-zinc-950 p-3 shadow-xl shadow-indigo-500/10",
        "rotate-2 scale-105 opacity-90"
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <span className="text-sm font-medium text-zinc-200 line-clamp-1">
          {app.job_title ?? "Unknown Job"}
        </span>
        {app.match_score != null && (
          <ScoreBadge score={app.match_score} size="sm" />
        )}
      </div>
      <p className="mb-2 text-xs text-zinc-500 line-clamp-1">
        {app.company_name ?? "Unknown Company"}
      </p>
      <span
        className={cn(
          "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium",
          config.pill
        )}
      >
        {config.shortLabel}
      </span>
    </div>
  );
}
