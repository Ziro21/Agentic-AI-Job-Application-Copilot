"use client";

import { useJobs, useJobsCount, useMatchedJobsCount } from "@/hooks/useJobs";
import { useAllApplications } from "@/hooks/useApplications";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/analytics/StatCard";
import { computeApplicationTrend } from "@/lib/trends";
import { ApplicationFunnel } from "@/components/analytics/ApplicationFunnel";
import { ScoreDistribution } from "@/components/analytics/ScoreDistribution";
import { ActivityTimeline } from "@/components/analytics/ActivityTimeline";
import { AnalyticsSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AnalyticsPage() {
  const { data: totalData } = useJobsCount();
  const { data: matchedData } = useMatchedJobsCount();
  const { data: appsData, isLoading: appsLoading } = useAllApplications();
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page_size: 200 });
  const { data: runsData } = useQuery({
    queryKey: queryKeys.runs.list({ page_size: 10 }),
    queryFn: () => api.runs.list({ page_size: 10 }),
    staleTime: 30_000,
  });

  const totalJobs = totalData?.total ?? 0;
  const matchedJobs = matchedData?.total ?? 0;
  const matchRate = totalJobs > 0 ? Math.round((matchedJobs / totalJobs) * 100) : 0;

  const apps = appsData?.items ?? [];
  const appRate =
    matchedJobs > 0 ? Math.round((apps.length / matchedJobs) * 100) : 0;
  const responseApps = apps.filter(
    (a) => !["rejected", "no_response", "saved"].includes(a.status)
  ).length;
  const responseRate =
    apps.length > 0 ? Math.round((responseApps / apps.length) * 100) : 0;

  const appTrend = computeApplicationTrend(apps);

  if (appsLoading && jobsLoading) {
    return (
      <AppShell>
        <AnalyticsSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="mb-6 text-lg font-semibold text-zinc-200">Analytics</h1>

        {/* KPI Row */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Jobs" value={totalJobs} />
          <StatCard label="Match Rate" value={`${matchRate}%`} sublabel={`${matchedJobs} matched`} />
          <StatCard label="Application Rate" value={`${appRate}%`} sublabel={`${apps.length} applied`} trend={appTrend} />
          <StatCard label="Response Rate" value={`${responseRate}%`} sublabel={`${responseApps} active`} />
        </div>

        {/* Charts Row */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Application Pipeline
            </h2>
            <ApplicationFunnel applications={apps} />
          </div>

          <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Score Distribution
            </h2>
            <ScoreDistribution jobs={jobsData?.items ?? []} />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recent Activity
          </h2>
          <ActivityTimeline
            applications={apps}
            runs={runsData?.items ?? []}
          />
        </div>
      </div>
    </AppShell>
  );
}
