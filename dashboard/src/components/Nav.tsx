"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function CopilotIcon() {
  return (
    <svg
      className="h-5 w-5 text-indigo-400"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="2.5" fill="currentColor" />
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1" opacity="0.15" />
      <path
        d="M10 4V2M10 18v-2M4 10H2M18 10h-2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();

  const { data: appsData } = useQuery({
    queryKey: ["applications-count"],
    queryFn: () => api.applications.list({ page_size: 1 }),
    staleTime: 30_000,
  });

  const appCount = appsData?.total ?? 0;

  const navItems = [
    { href: "/", label: "Jobs", count: undefined as number | undefined },
    { href: "/applications", label: "Applications", count: appCount },
    { href: "/runs", label: "Runs", count: undefined as number | undefined },
    { href: "/metrics", label: "Telemetry", count: undefined as number | undefined },
  ];

  return (
    <nav className="sticky top-0 z-40 flex items-center gap-1 border-b border-zinc-800/80 bg-zinc-950/90 px-6 py-3 backdrop-blur-sm">
      <Link
        href="/"
        className="flex items-center gap-2 font-mono text-sm font-semibold text-zinc-100 transition-colors hover:text-white"
      >
        <CopilotIcon />
        Job Copilot
      </Link>

      <div className="ml-8 flex gap-1">
        {navItems.map(({ href, label, count }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              {label}
              {count != null && count > 0 && (
                <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] leading-none text-indigo-400">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
