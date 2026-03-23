"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  Bookmark,
  Banknote,
} from "lucide-react";
import { useJob } from "@/hooks/useJobs";
import { useUpsertApplication } from "@/hooks/useApplications";
import { AppShell } from "@/components/layout/AppShell";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { FilterBadge } from "@/components/shared/FilterBadge";
import { StatusBadge } from "@/components/applications/StatusBadge";
import { PipelineStepper } from "@/components/applications/PipelineStepper";
import { ActivityLog } from "@/components/applications/ActivityLog";
import { JobDescription } from "@/components/jobs/JobDescription";
import { QueryError } from "@/components/shared/ErrorBoundary";
import { JobDetailSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, getInitials } from "@/lib/utils";
import { getActivityLog, appendActivityEntry } from "@/lib/activity";
import { extractSalary } from "@/lib/salary";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: job, isLoading, error, refetch } = useJob(id);
  const upsert = useUpsertApplication();
  const [notes, setNotes] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState<string>("");

  const app = job?.application;

  // Initialize follow-up date from app data
  const followUpSource = app?.next_follow_up_at;
  const derivedFollowUp = followUpSource ? followUpSource.split("T")[0] : "";
  if (derivedFollowUp && derivedFollowUp !== followUpDate && followUpDate === "") {
    setFollowUpDate(derivedFollowUp);
  }

  // Extract salary from job content
  const salary = useMemo(
    () => extractSalary(job?.content_text ?? null),
    [job?.content_text]
  );

  if (isLoading) {
    return (
      <AppShell>
        <JobDetailSkeleton />
      </AppShell>
    );
  }

  if (error || !job) {
    return (
      <AppShell>
        <QueryError error={error} onRetry={() => refetch()} />
      </AppShell>
    );
  }

  const currentNotes = notes ?? app?.notes ?? "";

  function handleStatusChange(status: string) {
    const updatedFields = appendActivityEntry(
      app?.custom_fields ?? {},
      {
        action: "status_change",
        from_status: app?.status,
        to_status: status,
      }
    );
    upsert.mutate({
      jobId: job!.id,
      payload: {
        status,
        applied_at: app?.applied_at,
        notes: currentNotes || null,
        custom_fields: updatedFields,
      },
    });
  }

  function handleSaveJob() {
    upsert.mutate({
      jobId: job!.id,
      payload: {
        status: "saved",
        custom_fields: { extracted_salary: salary?.display ?? null },
      },
    });
  }

  function handleNotesBlur() {
    if (app && currentNotes !== (app.notes ?? "")) {
      const updatedFields = appendActivityEntry(
        app.custom_fields ?? {},
        { action: "note_added", detail: "Notes updated" }
      );
      upsert.mutate({
        jobId: job!.id,
        payload: {
          status: app.status,
          applied_at: app.applied_at,
          notes: currentNotes || null,
          custom_fields: updatedFields,
        },
      });
    }
  }

  function handleFollowUpChange(date: string) {
    setFollowUpDate(date);
    const updatedFields = appendActivityEntry(
      app?.custom_fields ?? {},
      { action: "follow_up_set", detail: `Set to ${date}` }
    );
    upsert.mutate({
      jobId: job!.id,
      payload: {
        status: app?.status ?? "saved",
        applied_at: app?.applied_at,
        notes: currentNotes || null,
        next_follow_up_at: date || null,
        custom_fields: updatedFields,
      },
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl p-6">
        {/* Back link */}
        <Link
          href="/jobs"
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to jobs
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 font-mono text-xs font-bold text-zinc-400">
              {getInitials(job.company.name)}
            </div>
            <div>
              <p className="text-xs text-zinc-500">{job.company.name}</p>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-100">{job.title}</h1>
                {app && <StatusBadge status={app.status} />}
              </div>
            </div>
            <div className="ml-auto">
              <ScoreBadge score={job.match_score} size="lg" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            {job.location_raw && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location_raw}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono text-emerald-400">
                <Banknote className="h-3 w-3" />
                {salary.display}
              </span>
            )}
            {job.employment_type && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">
                {job.employment_type}
              </span>
            )}
            {job.updated_at_source && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(job.updated_at_source)}
              </span>
            )}
            <a
              href={job.absolute_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-indigo-400 transition-colors hover:text-indigo-300"
            >
              <ExternalLink className="h-3 w-3" />
              View on Greenhouse
            </a>
          </div>
        </div>

        {/* Application Status Block */}
        <div className="mb-6 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
          {app ? (
            <div className="space-y-4">
              <PipelineStepper
                currentStatus={app.status}
                onStatusChange={handleStatusChange}
                isLoading={upsert.isPending}
              />

              {/* Follow-up Date Picker */}
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                  Next Follow-up
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => handleFollowUpChange(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">
                  Notes
                </label>
                <Textarea
                  value={currentNotes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add notes about this application..."
                  className="min-h-[80px] resize-none bg-zinc-900 text-sm"
                />
              </div>

              {/* Activity Timeline */}
              <ActivityLog entries={getActivityLog(app.custom_fields ?? {})} />
            </div>
          ) : (
            <Button
              onClick={handleSaveJob}
              disabled={upsert.isPending}
              className="cursor-pointer gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Bookmark className="h-4 w-4" />
              Save this job
            </Button>
          )}
        </div>

        {/* Analysis Grid */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Filter Analysis */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Filter Analysis
            </h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <FilterBadge label="UK Location" passed={job.filter_is_uk} />
              </div>
              <div className="flex items-center gap-2">
                <FilterBadge
                  label="Entry Level"
                  passed={job.filter_is_entry_level}
                />
              </div>
              <div className="flex items-center gap-2">
                <FilterBadge label="AI/ML Role" passed={job.filter_is_ai_ml} />
              </div>
              {job.filter_reasons.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-zinc-800/50 pt-3">
                  {job.filter_reasons.map((reason, i) => (
                    <p key={i} className="text-xs text-zinc-500">
                      {reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Reasons */}
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Match Reasons
            </h2>
            {job.match_reasons.length > 0 ? (
              <ul className="space-y-1.5">
                {job.match_reasons.map((reason, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-indigo-400/80"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-zinc-600">No match reasons available</p>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Job Description
          </h2>
          <JobDescription html={job.content_text} text={job.content_html} />
        </div>
      </div>
    </AppShell>
  );
}
