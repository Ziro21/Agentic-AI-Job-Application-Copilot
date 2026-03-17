"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FilterBadges } from "@/components/FilterBadges";
import { APPLICATION_STATUSES } from "@/lib/types";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.jobs.get(id),
    enabled: !!id,
  });

  const updateApplication = useMutation({
    mutationFn: (payload: { status: string; applied_at?: string | null; notes?: string | null }) =>
      api.jobs.upsertApplication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-8 w-96 animate-pulse rounded bg-zinc-700" />
        <div className="mt-4 h-4 w-64 animate-pulse rounded bg-zinc-700" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-red-400">Failed to load job</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-zinc-400 hover:text-white"
        >
          ← Back
        </button>
      </div>
    );
  }

  const applicationUrl = job.application_url || job.absolute_url;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-zinc-400 hover:text-white"
      >
        ← Back to jobs
      </button>

      <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">{job.title}</h1>
            <p className="mt-1 font-mono text-zinc-400">{job.company.name}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ScoreBadge score={job.match_score} />
              <FilterBadges
                isUk={job.filter_is_uk}
                isEntryLevel={job.filter_is_entry_level}
                isAiMl={job.filter_is_ai_ml}
              />
              {job.location_raw && (
                <span className="text-sm text-zinc-500">{job.location_raw}</span>
              )}
              {job.is_remote && (
                <span className="text-sm text-emerald-500">Remote</span>
              )}
              {job.employment_type && (
                <span className="text-sm text-zinc-500">{job.employment_type}</span>
              )}
            </div>
          </div>
          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Apply →
          </a>
        </div>

        {job.application && (
          <div className="mt-6 rounded border border-zinc-700/50 bg-zinc-800/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Application status
            </p>
            <p className="mt-1 font-mono text-zinc-400">{job.application.status}</p>
            {job.application.applied_at && (
              <p className="mt-1 text-xs text-zinc-500">
                Applied {format(new Date(job.application.applied_at), "PPp")}
              </p>
            )}
            {job.application.notes && (
              <p className="mt-2 text-sm text-zinc-400">{job.application.notes}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {!job.application ? (
            <button
              onClick={() =>
                updateApplication.mutate({
                  status: "saved",
                  applied_at: null,
                  notes: null,
                })
              }
              disabled={updateApplication.isPending}
              className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              Save
            </button>
          ) : null}
          {APPLICATION_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() =>
                updateApplication.mutate({
                  status,
                  applied_at:
                    status === "applied" ? new Date().toISOString() : undefined,
                  notes: job.application?.notes ?? undefined,
                })
              }
              disabled={updateApplication.isPending}
              className={`rounded px-3 py-1.5 text-sm ${
                job.application?.status === status
                  ? "bg-zinc-600 text-white"
                  : "border border-zinc-600 text-zinc-400 hover:bg-zinc-700"
              } disabled:opacity-50`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {job.filter_reasons.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Filter reasons
          </h3>
          <ul className="mt-2 space-y-1 font-mono text-sm text-zinc-400">
            {job.filter_reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {job.match_reasons.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Match reasons
          </h3>
          <ul className="mt-2 space-y-1 font-mono text-sm text-zinc-400">
            {job.match_reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Job description
        </h3>
        <div className="prose prose-invert mt-4 max-w-none">
          {job.content_text ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-300">
              {job.content_text}
            </pre>
          ) : (
            <p className="text-zinc-500">No description available.</p>
          )}
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-zinc-400">
        Last seen {format(new Date(job.last_seen_at), "PPp")}
      </p>
    </div>
  );
}
