"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FolderKanban, BarChart3, Activity, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobsCount } from "@/hooks/useJobs";
import { useAllApplications } from "@/hooks/useApplications";
import { useFollowUpCounts, useFollowUpApplications } from "@/hooks/useFollowUps";
import { IngestStatus } from "@/components/shared/IngestStatus";
import { FollowUpWidget } from "@/components/shared/FollowUpWidget";

function RadarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <line x1="12" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/jobs", label: "Jobs", icon: Briefcase, countKey: "jobs" as const },
  { href: "/applications", label: "Applications", icon: FolderKanban, countKey: "apps" as const },
  { href: "/analytics", label: "Analytics", icon: BarChart3, countKey: null },
  { href: "/runs", label: "Runs", icon: Activity, countKey: null },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: jobsData } = useJobsCount();
  const { data: appsData } = useAllApplications();
  const followUpCounts = useFollowUpCounts();
  const followUpGroups = useFollowUpApplications();

  const counts = {
    jobs: jobsData?.total ?? 0,
    apps: appsData?.total ?? 0,
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-60 flex-col border-r border-zinc-800/50 bg-zinc-950",
          "transition-transform duration-200 ease-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-zinc-800/50 px-5">
          <RadarIcon />
          <span className="text-sm font-semibold text-zinc-200">Job Copilot</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Ingest status */}
        <div className="px-3 py-3">
          <IngestStatus variant="compact" />
        </div>

        {/* Follow-up Reminders */}
        {followUpCounts.total > 0 && (
          <div className="px-3 pb-2">
            <FollowUpWidget
              overdue={followUpGroups.overdue}
              dueToday={followUpGroups.dueToday}
              upcoming={followUpGroups.upcoming}
            />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const count = item.countKey ? counts[item.countKey] : null;
              const showOverdue =
                item.href === "/applications" && followUpCounts.overdue > 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "border-l-2 border-indigo-500 bg-indigo-500/10 text-zinc-100"
                        : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {showOverdue && (
                      <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-400">
                        {followUpCounts.overdue}
                      </span>
                    )}
                    {count != null && count > 0 && !showOverdue && (
                      <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-indigo-400">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-zinc-800/50 px-5 py-3">
          <span className="font-mono text-[10px] text-zinc-600">v2.0.0</span>
        </div>
      </aside>
    </>
  );
}
