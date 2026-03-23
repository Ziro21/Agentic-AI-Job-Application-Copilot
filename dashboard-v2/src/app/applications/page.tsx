"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAllApplications, useUpsertApplication } from "@/hooks/useApplications";
import { appendActivityEntry } from "@/lib/activity";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanBoard } from "@/components/applications/KanbanBoard";
import { ApplicationTable } from "@/components/applications/ApplicationTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/ErrorBoundary";
import { ApplicationsSkeleton } from "@/components/shared/LoadingSkeleton";
import { PIPELINE_STAGES, getStatusConfig } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ApplicationsPage() {
  const { data, isLoading, error, refetch } = useAllApplications();
  const upsert = useUpsertApplication();
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (data?.items) {
      for (const app of data.items) {
        counts[app.status] = (counts[app.status] ?? 0) + 1;
      }
    }
    return counts;
  }, [data]);

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    if (!filterStatus) return data.items;
    return data.items.filter((a) => a.status === filterStatus);
  }, [data, filterStatus]);

  const router = useRouter();

  function handleStatusChange(jobId: string, newStatus: string) {
    const app = data?.items.find((a) => a.job_id === jobId);
    const updatedFields = appendActivityEntry(
      app?.custom_fields ?? {},
      {
        action: "status_change",
        from_status: app?.status,
        to_status: newStatus,
      }
    );
    upsert.mutate({
      jobId,
      payload: {
        status: newStatus,
        applied_at: app?.applied_at,
        notes: app?.notes,
        custom_fields: updatedFields,
      },
    });
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-200">Applications</h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "h-8 w-8 cursor-pointer",
                viewMode === "kanban" ? "text-zinc-200" : "text-zinc-600"
              )}
              aria-label="Kanban view"
            >
              <FolderKanban className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("table")}
              className={cn(
                "h-8 w-8 cursor-pointer",
                viewMode === "table" ? "text-zinc-200" : "text-zinc-600"
              )}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pipeline Summary Strip */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus(null)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              !filterStatus
                ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25"
                : "border border-zinc-800 text-zinc-500 hover:text-zinc-300"
            )}
          >
            All ({data?.total ?? 0})
          </button>
          {PIPELINE_STAGES.map((stage) => {
            const config = getStatusConfig(stage);
            const count = pipelineCounts[stage] ?? 0;
            const isActive = filterStatus === stage;

            return (
              <button
                key={stage}
                onClick={() => setFilterStatus(isActive ? null : stage)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? config.pill
                    : "border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.shortLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <ApplicationsSkeleton />
        ) : error ? (
          <QueryError error={error} onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No applications yet"
            description="Save a job to start tracking your applications"
            action={{
              label: "Browse jobs",
              onClick: () => router.push("/jobs"),
            }}
          />
        ) : viewMode === "kanban" ? (
          <KanbanBoard
            applications={filtered}
            onStatusChange={handleStatusChange}
            isLoading={upsert.isPending}
          />
        ) : (
          <ApplicationTable
            applications={filtered}
            onStatusChange={handleStatusChange}
            isLoading={upsert.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}
