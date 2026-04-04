"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { api } from "@/lib/api";
import { JobRow } from "@/components/JobRow";
import { IngestStatus } from "@/components/IngestStatus";
import { StatStrip } from "@/components/StatStrip";
import { SlideOverLoader } from "@/components/SlideOverLoader";
import { Suspense } from "react";

export default function JobsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");
  const [passedFiltersOnly, setPassedFiltersOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"score_desc" | "recent_desc">("score_desc");

  // Debounce search 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", search, minScore, passedFiltersOnly, page, sort],
    queryFn: () =>
      api.jobs.list({
        q: search || undefined,
        min_score: minScore !== "" ? minScore : undefined,
        passed_filters_only: passedFiltersOnly,
        page,
        page_size: 200, // Expert Upgrade Validation: Rendering massive data feed natively
        sort,
      }),
  });

  // Fetch all applications to show status indicator on each row
  const { data: appsData } = useQuery({
    queryKey: ["applications-all"],
    queryFn: () => api.applications.list({ page_size: 200 }),
    staleTime: 30_000,
  });

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    appsData?.items.forEach((a) => map.set(a.job_id, a.status));
    return map;
  }, [appsData]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;
  const items = data?.items ?? [];
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    if (listRef.current) {
      setScrollMargin(listRef.current.offsetTop);
    }
  }, [items.length]);

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 92, // ~92px height standard
    overscan: 10,
    scrollMargin,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Suspense fallback={null}>
        <SlideOverLoader />
      </Suspense>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Job Discovery</h1>
        <p className="mt-0.5 text-sm text-zinc-400">
          UK entry-level AI/ML roles, scored and filtered
        </p>
      </div>

      {/* KPI stats */}
      <div className="mb-5">
        <StatStrip />
      </div>

      {/* Last ingest status */}
      <div className="mb-8">
        <IngestStatus />
      </div>

      {/* Mobile filter row */}
      <div className="mb-5 flex flex-wrap gap-3 lg:hidden">
        <input
          aria-label="Search jobs"
          type="search"
          placeholder="Search jobs..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-700/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
        />
        <select
          aria-label="Minimum Match Score"
          value={minScore === "" ? "all" : minScore}
          onChange={(e) => {
            const v = e.target.value;
            setMinScore(v === "all" ? "" : Number(v));
            setPage(1);
          }}
          className="rounded border border-zinc-700/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none"
        >
          <option value="all">Any score</option>
          {[50, 60, 70, 80, 90].map((s) => (
            <option key={s} value={s}>
              {s}+
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            aria-label="Filter by passed algorithms only"
            type="checkbox"
            checked={passedFiltersOnly}
            onChange={(e) => {
              setPassedFiltersOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30"
          />
          <span className="text-sm text-zinc-400">Matched only</span>
        </label>
      </div>

      {/* Sidebar + job list */}
      <div className="flex gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24 space-y-5">
            <div>
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Search
              </p>
              <input
                aria-label="Search titles and companies"
                type="search"
                placeholder="Title, company, skills..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded border border-zinc-700/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Min score
              </p>
              <select
                aria-label="Sidebar Minimum Score"
                value={minScore === "" ? "all" : minScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setMinScore(v === "all" ? "" : Number(v));
                  setPage(1);
                }}
                className="w-full rounded border border-zinc-700/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors focus:border-indigo-500/50 focus:outline-none"
              >
                <option value="all">Any score</option>
                {[50, 60, 70, 80, 90].map((s) => (
                  <option key={s} value={s}>
                    {s}+ / 100
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Sort
              </p>
              <select
                aria-label="Sort configurations"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as "score_desc" | "recent_desc");
                  setPage(1);
                }}
                className="w-full rounded border border-zinc-700/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition-colors focus:border-indigo-500/50 focus:outline-none"
              >
                <option value="score_desc">Best match</option>
                <option value="recent_desc">Most recent</option>
              </select>
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  aria-label="Toggle passed filters explicitly"
                  type="checkbox"
                  checked={passedFiltersOnly}
                  onChange={(e) => {
                    setPassedFiltersOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500/30"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    Passed filters
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    UK · Entry · AI/ML
                  </p>
                </div>
              </label>
            </div>
          </div>
        </aside>

        {/* Main job list */}
        <div className="min-w-0 flex-1">
          {data && (
            <p className="mb-3 font-mono text-xs text-zinc-400">
              {data.total} job{data.total !== 1 ? "s" : ""}
              {search && (
                <span>
                  {" "}
                  matching{" "}
                  <span className="text-zinc-400">&ldquo;{search}&rdquo;</span>
                </span>
              )}
            </p>
          )}

          {isLoading ? (
            <div className="space-y-px">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded bg-zinc-900/60"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-6">
              <p className="text-sm text-red-400">
                Failed to load jobs: {String(error)}
              </p>
              <p className="mt-2 font-mono text-xs text-zinc-400">
                Is the API running?{" "}
                <code className="text-zinc-400">uvicorn api.main:app --reload</code>
              </p>
            </div>
          ) : data && data.items.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-12 text-center">
              <p className="text-sm text-zinc-400">No jobs found.</p>
              <p className="mt-2 font-mono text-xs text-zinc-400">
                {search || minScore !== "" || passedFiltersOnly
                  ? "Try adjusting your filters."
                  : "Run the Greenhouse collector to populate jobs."}
              </p>
            </div>
          ) : (
            <>
              <div ref={listRef} className="overflow-hidden rounded-lg border border-zinc-800/60 bg-zinc-900/30 relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const job = items[virtualRow.index];
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <JobRow
                        job={job}
                        applicationStatus={statusMap.get(job.id)}
                      />
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="font-mono text-xs text-zinc-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                      className="cursor-pointer rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
