import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { getStatusConfig } from "@/lib/status";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationCard } from "./ApplicationCard";
import { ArrowRight } from "lucide-react";
import type { ApplicationWithJob } from "@/lib/types";

interface KanbanColumnProps {
  status: string;
  applications: ApplicationWithJob[];
  onStatusChange: (appJobId: string, newStatus: string) => void;
  isLoading?: boolean;
}

export function KanbanColumn({
  status,
  applications,
  onStatusChange,
  isLoading,
}: KanbanColumnProps) {
  const config = getStatusConfig(status);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg transition-colors duration-150",
        isOver && "bg-indigo-500/5 ring-1 ring-indigo-500/30"
      )}
    >
      {/* Column header */}
      <div
        className={`mb-3 flex items-center gap-2 border-t-2 pt-3 ${config.column}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        <span className="text-xs font-medium text-zinc-300">
          {config.label}
        </span>
        <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pb-4 pr-2">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-8 text-center">
              <ArrowRight className="mb-2 h-4 w-4 text-zinc-700" />
              <p className="text-[10px] text-zinc-600">
                Drag applications here
              </p>
            </div>
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onStatusChange={(newStatus) =>
                  onStatusChange(app.job_id, newStatus)
                }
                isLoading={isLoading}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
