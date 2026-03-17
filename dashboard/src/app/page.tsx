"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { JobRow } from "@/components/JobRow";
import { IngestStatus } from "@/components/IngestStatus";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState<number | "">("");
  const [passedFiltersOnly, setPassedFiltersOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"score_desc" | "recent_desc">("score_desc");

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "jobs",
      search,
      minScore,
      passedFiltersOnly,
      page,
      sort,
    ],
    queryFn: () =>
      api.jobs.list({
        q: search || undefined,
        min_score: minScore !== "" ? minScore : undefined,
        passed_filters_only: passedFiltersOnly,
        page,
        page_size: 20,
        sort,
      }),
  });

  const totalPages = data
    ? Math.ceil(data.total / data.page_size)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-white">Jobs</h1>
        <IngestStatus />
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="search"
          placeholder="Search title, location, content..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        <select
          value={minScore === "" ? "all" : minScore}
          onChange={(e) => {
            const v = e.target.value;
            setMinScore(v === "all" ? "" : Number(v));
            setPage(1);
          }}
          className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        >
          <option value="all">Min score: all</option>
          {[50, 60, 70, 80, 90].map((s) => (
            <option key={s} value={s}>
              Min {s}+
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={passedFiltersOnly}
            onChange={(e) => {
              setPassedFiltersOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-zinc-400">Passed filters only</span>
        </label>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as "score_desc" | "recent_desc");
            setPage(1);
          }}
          className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
        >
          <option value="score_desc">Sort: score ↓</option>
          <option value="recent_desc">Sort: recent ↓</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded bg-zinc-800/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6">
          <p className="text-red-400">Failed to load jobs: {String(error)}</p>
          <p className="mt-2 text-sm text-zinc-500">
            Ensure the API is running: <code className="font-mono">uvicorn api.main:app --reload</code>
          </p>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400">No jobs found.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Run the Greenhouse collector to populate jobs.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50">
            {data?.items.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="font-mono text-sm text-zinc-500">
                {data?.total} total • page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
