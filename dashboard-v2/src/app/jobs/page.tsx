"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, SearchX, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useJobs, useJobsCount, useMatchedJobsCount } from "@/hooks/useJobs";
import { useAllApplications, useUpsertApplication } from "@/hooks/useApplications";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { computeApplicationTrend } from "@/lib/trends";
import { AppShell } from "@/components/layout/AppShell";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobRow } from "@/components/jobs/JobRow";
import { JobCard } from "@/components/jobs/JobCard";
import { StatCard } from "@/components/analytics/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { QueryError } from "@/components/shared/ErrorBoundary";
import { JobListSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrendData } from "@/lib/types";

export default function JobsPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState<"score_desc" | "recent_desc">("score_desc");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput);

  const params = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      min_score: minScore > 0 ? minScore : undefined,
      sort,
      passed_filters_only: matchedOnly || undefined,
      page,
      page_size: 20,
    }),
    [debouncedSearch, minScore, sort, matchedOnly, page]
  );

  const { data, isLoading, error, refetch } = useJobs(params);
  const { data: totalData } = useJobsCount();
  const { data: matchedData } = useMatchedJobsCount();
  const { data: appsData } = useAllApplications();

  // F7: Quick-action mutations
  const upsert = useUpsertApplication();

  const onQuickSave = useCallback(
    (jobId: string) => {
      upsert.mutate({ jobId, payload: { status: "saved" } });
    },
    [upsert]
  );

  const onQuickStatusChange = useCallback(
    (jobId: string, status: string) => {
      upsert.mutate({ jobId, payload: { status } });
    },
    [upsert]
  );

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    if (appsData?.items) {
      for (const app of appsData.items) {
        map.set(app.job_id, app.status);
      }
    }
    return map;
  }, [appsData]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;
  const activeApps = appsData?.items?.filter(
    (a) => !["rejected", "no_response"].includes(a.status)
  ).length ?? 0;
  const offers = appsData?.items?.filter((a) => a.status === "offer").length ?? 0;

  // F6: Trend indicators
  const appsTrend: TrendData | undefined = useMemo(() => {
    if (!appsData?.items || appsData.items.length === 0) return undefined;
    const activeItems = appsData.items.filter(
      (a) => !["rejected", "no_response"].includes(a.status)
    );
    return computeApplicationTrend(activeItems);
  }, [appsData]);

  const offersTrend: TrendData | undefined = useMemo(() => {
    if (!appsData?.items || appsData.items.length === 0) return undefined;
    const offerItems = appsData.items.filter((a) => a.status === "offer");
    return computeApplicationTrend(offerItems);
  }, [appsData]);

  // F9: Keyboard navigation
  const jobIds = useMemo(
    () => data?.items?.map((j) => j.id) ?? [],
    [data?.items]
  );

  const { activeId } = useKeyboardNav({
    items: jobIds,
    onSelect: (id) => {
      router.push(`/jobs/${id}`);
    },
    onAction: (id, key) => {
      if (key === "s") {
        const currentStatus = statusMap.get(id);
        if (!currentStatus) {
          onQuickSave(id);
        }
      }
    },
    enabled: !isLoading && !!data,
  });

  // Check whether any filter is active (for the improved empty state)
  const hasActiveFilters = debouncedSearch !== "" || minScore > 0 || matchedOnly;

  function handleReset() {
    setSearchInput("");
    setMinScore(0);
    setSort("score_desc");
    setMatchedOnly(false);
    setPage(1);
  }

  return (
    <AppShell>
      <div className="p-6">
        {/* KPI Strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Jobs" value={totalData?.total ?? "—"} />
          <StatCard label="Matched" value={matchedData?.total ?? "—"} />
          <StatCard label="Active Applications" value={activeApps} trend={appsTrend} />
          <StatCard label="Offers" value={offers} trend={offersTrend} />
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters — desktop */}
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-6">
              <JobFilters
                search={searchInput}
                onSearchChange={(v) => { setSearchInput(v); setPage(1); }}
                minScore={minScore}
                onMinScoreChange={(v) => { setMinScore(v); setPage(1); }}
                sort={sort}
                onSortChange={setSort}
                matchedOnly={matchedOnly}
                onMatchedOnlyChange={(v) => { setMatchedOnly(v); setPage(1); }}
                onReset={handleReset}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                {data ? (
                  <>
                    <span className="font-mono text-zinc-300">{data.total}</span>{" "}
                    jobs{debouncedSearch && ` matching "${debouncedSearch}"`}
                  </>
                ) : (
                  "Loading..."
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8 cursor-pointer",
                    viewMode === "list" ? "text-zinc-200" : "text-zinc-600"
                  )}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8 cursor-pointer",
                    viewMode === "grid" ? "text-zinc-200" : "text-zinc-600"
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mobile filters */}
            <div className="mb-4 lg:hidden">
              <JobFilters
                search={searchInput}
                onSearchChange={(v) => { setSearchInput(v); setPage(1); }}
                minScore={minScore}
                onMinScoreChange={(v) => { setMinScore(v); setPage(1); }}
                sort={sort}
                onSortChange={setSort}
                matchedOnly={matchedOnly}
                onMatchedOnlyChange={(v) => { setMatchedOnly(v); setPage(1); }}
                onReset={handleReset}
              />
            </div>

            {/* Content */}
            {isLoading ? (
              <JobListSkeleton />
            ) : error ? (
              <QueryError error={error} onRetry={() => refetch()} />
            ) : !data || data.items.length === 0 ? (
              // F8: Improved empty state — contextual based on active filters
              hasActiveFilters ? (
                <EmptyState
                  icon={Filter}
                  title="No jobs match your filters"
                  description="Try adjusting your search or filter criteria"
                  action={{ label: "Clear filters", onClick: handleReset }}
                />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="No jobs found"
                  description="Try adjusting your filters or search query"
                  action={{ label: "Reset filters", onClick: handleReset }}
                />
              )
            ) : viewMode === "list" ? (
              <div className="overflow-hidden rounded-xl border border-zinc-800/50">
                {data.items.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    applicationStatus={statusMap.get(job.id)}
                    onQuickSave={onQuickSave}
                    onQuickStatusChange={onQuickStatusChange}
                    isActive={activeId === job.id}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    applicationStatus={statusMap.get(job.id)}
                    onQuickSave={onQuickSave}
                    onQuickStatusChange={onQuickStatusChange}
                  />
                ))}
              </div>
            )}

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
          </div>
        </div>
      </div>
    </AppShell>
  );
}
