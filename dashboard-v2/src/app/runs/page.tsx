"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, AlertTriangle, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { AppShell } from "@/components/layout/AppShell";
import { IngestStatus } from "@/components/shared/IngestStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/ErrorBoundary";
import { RunsSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function RunsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.runs.list({ page, page_size: 20 }),
    queryFn: () => api.runs.list({ page, page_size: 20 }),
  });

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-lg font-semibold text-zinc-200">
          Ingest Runs
        </h1>

        {/* Latest run widget */}
        <div className="mb-6">
          <IngestStatus variant="full" />
        </div>

        {/* Runs Table */}
        {isLoading ? (
          <RunsSkeleton />
        ) : error ? (
          <QueryError error={error} onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No runs recorded"
            description="Run the ingest pipeline to start collecting jobs"
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800/50 hover:bg-transparent">
                    <TableHead className="text-zinc-500">Started</TableHead>
                    <TableHead className="text-zinc-500">Duration</TableHead>
                    <TableHead className="text-zinc-500">Status</TableHead>
                    <TableHead className="text-zinc-500">Boards</TableHead>
                    <TableHead className="text-zinc-500">Fetched</TableHead>
                    <TableHead className="text-zinc-500">New</TableHead>
                    <TableHead className="text-zinc-500">Updated</TableHead>
                    <TableHead className="text-zinc-500">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((run) => (
                    <TableRow
                      key={run.id}
                      className="border-zinc-800/30 hover:bg-zinc-900/30"
                    >
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {formatDate(run.started_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {formatDuration(run.started_at, run.ended_at)}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              run.status === "success" && "bg-emerald-400",
                              run.status === "partial" && "bg-amber-400",
                              run.status === "failed" && "bg-red-400"
                            )}
                          />
                          <span className="font-mono text-xs text-zinc-400">
                            {run.status}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {run.boards_checked}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {run.jobs_fetched}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {run.jobs_created}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {run.jobs_updated}
                      </TableCell>
                      <TableCell>
                        {run.errors_count > 0 ? (
                          <Popover>
                            <PopoverTrigger className="flex cursor-pointer items-center gap-1 text-xs text-red-400 hover:text-red-300">
                              <AlertTriangle className="h-3 w-3" />
                              {run.errors_count}
                            </PopoverTrigger>
                            <PopoverContent
                              className="max-w-sm border-zinc-800 bg-zinc-950"
                              side="left"
                            >
                              <div className="space-y-1">
                                <p className="mb-2 text-xs font-medium text-zinc-300">
                                  Error Details
                                </p>
                                {run.errors_sample.map((err, i) => (
                                  <p
                                    key={i}
                                    className="break-all font-mono text-[10px] text-red-400/80"
                                  >
                                    {err}
                                  </p>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="font-mono text-xs text-zinc-600">
                            0
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-mono text-xs text-zinc-400">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
