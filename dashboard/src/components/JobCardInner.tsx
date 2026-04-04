"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FilterBadges } from "@/components/FilterBadges";
import { StatusBadge } from "@/components/StatusBadge";
import { getStatusConfig, PIPELINE_STAGES, EXIT_STATUSES } from "@/lib/status";

export function JobCardInner({ jobId, onClose }: { jobId: string, onClose?: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = jobId;

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.jobs.get(id),
    enabled: !!id,
  });

  const updateApplication = useMutation({
    mutationFn: (payload: {
      status: string;
      applied_at?: string | null;
      notes?: string | null;
    }) => api.jobs.upsertApplication(id, payload),
    onMutate: async (newPayload) => {
      await queryClient.cancelQueries({ queryKey: ["job", id] });
      const previousJob = queryClient.getQueryData(["job", id]);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["job", id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          application: { ...old.application, ...newPayload }
        };
      });
      
      return { previousJob };
    },
    onError: (err, newPayload, context) => {
      queryClient.setQueryData(["job", id], context?.previousJob);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["job", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications-all"] });
      queryClient.invalidateQueries({ queryKey: ["applications-count"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const mutate = (status: string) =>
    updateApplication.mutate({
      status,
      applied_at:
        status === "applied"
          ? new Date().toISOString()
          : (job?.application?.applied_at ?? null),
      notes: job?.application?.notes ?? null,
    });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-7 w-80 animate-pulse rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded bg-zinc-800" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-red-400">Failed to load job</p>
        <button
          onClick={() => router.back()}
          className="mt-4 cursor-pointer text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back
        </button>
      </div>
    );
  }

  const applicationUrl = job.application_url || job.absolute_url;
  const currentStatus = job.application?.status;

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 pb-16">
      {onClose && (
        <button
          onClick={onClose}
          className="mb-4 inline-flex items-center text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
      )}

      {/* Header card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{job.title}</h1>
              {currentStatus && <StatusBadge status={currentStatus} />}
            </div>
            <p className="mt-1 font-mono text-sm text-zinc-500">
              {job.company.name}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ScoreBadge score={job.match_score} />
              <FilterBadges
                isUk={job.filter_is_uk}
                isEntryLevel={job.filter_is_entry_level}
                isAiMl={job.filter_is_ai_ml}
              />
              {job.location_raw && (
                <span className="text-xs text-zinc-500">{job.location_raw}</span>
              )}
              {job.is_remote && (
                <span className="text-xs text-emerald-500/80">· Remote</span>
              )}
              {job.employment_type && (
                <span className="text-xs text-zinc-400">{job.employment_type}</span>
              )}
            </div>
          </div>
          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Apply →
          </a>
        </div>

        {/* Active application status display */}
        {job.application && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${getStatusConfig(currentStatus!).dot}`}
            />
            <p className="text-sm font-medium text-zinc-300">
              {getStatusConfig(currentStatus!).label}
            </p>
            {job.application.applied_at && (
              <p className="font-mono text-xs text-zinc-400">
                Applied {format(new Date(job.application.applied_at), "PP")}
              </p>
            )}
            {job.application.notes && (
              <p className="ml-auto text-xs italic text-zinc-500">
                {job.application.notes}
              </p>
            )}
          </div>
        )}

        {/* Pipeline stepper */}
        <div className="mt-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Application pipeline
          </p>

          {!job.application && (
            <button
              onClick={() => mutate("saved")}
              disabled={updateApplication.isPending}
              className="mb-4 cursor-pointer rounded border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Save this job
            </button>
          )}

          <div className="flex flex-wrap items-center gap-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const cfg = getStatusConfig(stage);
              const isCurrent = currentStatus === stage;
              const stageIndex = PIPELINE_STAGES.indexOf(
                currentStatus as (typeof PIPELINE_STAGES)[number],
              );
              const isPast = stageIndex > i;

              return (
                <div key={stage} className="flex items-center">
                  <button
                    onClick={() => mutate(stage)}
                    disabled={updateApplication.isPending}
                    title={cfg.label}
                    className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isCurrent
                        ? `${cfg.pill} font-semibold`
                        : isPast
                          ? "text-zinc-400 hover:text-zinc-300"
                          : "border border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {cfg.label}
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <svg
                      className="mx-1 h-3 w-3 shrink-0 text-zinc-700"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          {job.application && (
            <div className="mt-3 flex gap-2">
              {EXIT_STATUSES.map((status) => {
                const cfg = getStatusConfig(status);
                const isCurrent = currentStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => mutate(status)}
                    disabled={updateApplication.isPending}
                    className={`cursor-pointer rounded px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
                      isCurrent
                        ? cfg.pill
                        : "border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Score & filter analysis grid */}
      {(job.filter_reasons.length > 0 || job.match_reasons.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {job.filter_reasons.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Filter analysis
              </p>
              <ul className="space-y-1">
                {job.filter_reasons.map((r, i) => (
                  <li key={i} className="font-mono text-xs text-zinc-500">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job.match_reasons.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Match reasons
              </p>
              <ul className="space-y-1">
                {job.match_reasons.map((r, i) => (
                  <li key={i} className="font-mono text-xs text-indigo-400/80">
                    · {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Job description */}
      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-6">
        <p className="mb-4 font-mono text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          Job description
        </p>
        {job.content_html ? (
          <div
            className="job-description"
            dangerouslySetInnerHTML={{ __html: job.content_html }}
          />
        ) : job.content_text ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {job.content_text}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No description available.</p>
        )}
      </div>

      <p className="mt-5 font-mono text-[10px] text-zinc-400">
        Last seen {format(new Date(job.last_seen_at), "PPp")}
      </p>
    </div>
  );
}
