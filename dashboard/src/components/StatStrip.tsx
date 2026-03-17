"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function StatCard({
  label,
  value,
  sub,
  color = "text-zinc-100",
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <p className={`font-mono text-2xl font-bold tabular-nums tracking-tight ${color}`}>
        {value}
      </p>
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      {sub && <p className="font-mono text-[10px] text-zinc-600">{sub}</p>}
    </div>
  );
}

export function StatStrip() {
  const { data: totalData } = useQuery({
    queryKey: ["jobs-count-all"],
    queryFn: () => api.jobs.list({ page_size: 1 }),
    staleTime: 60_000,
  });

  const { data: matchedData } = useQuery({
    queryKey: ["jobs-count-matched"],
    queryFn: () => api.jobs.list({ passed_filters_only: true, page_size: 1 }),
    staleTime: 60_000,
  });

  const { data: appsData } = useQuery({
    queryKey: ["applications-all"],
    queryFn: () => api.applications.list({ page_size: 200 }),
    staleTime: 30_000,
  });

  const appItems = appsData?.items ?? [];
  const savedCount = appItems.filter((a) => a.status === "saved").length;
  const activeCount = appItems.filter(
    (a) => !["rejected", "no_response", "saved"].includes(a.status),
  ).length;
  const offerCount = appItems.filter((a) => a.status === "offer").length;

  const matchRate =
    totalData?.total && matchedData?.total
      ? Math.round((matchedData.total / totalData.total) * 100)
      : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total jobs"
        value={totalData?.total ?? "—"}
        sub="in database"
      />
      <StatCard
        label="Matched"
        value={matchedData?.total ?? "—"}
        sub={matchRate != null ? `${matchRate}% match rate` : "pass all filters"}
        color="text-indigo-400"
      />
      <StatCard
        label="Saved"
        value={savedCount || appsData ? savedCount : "—"}
        sub="to review"
        color="text-sky-400"
      />
      <StatCard
        label="In pipeline"
        value={appsData ? activeCount : "—"}
        sub={offerCount > 0 ? `${offerCount} offer${offerCount > 1 ? "s" : ""}` : "applied & beyond"}
        color={offerCount > 0 ? "text-emerald-400" : "text-violet-400"}
      />
    </div>
  );
}
