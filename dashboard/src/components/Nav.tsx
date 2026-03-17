"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/runs", label: "Runs" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-900/50 px-6 py-3">
      <Link
        href="/"
        className="font-mono text-sm font-semibold text-zinc-100 hover:text-white"
      >
        Job Copilot
      </Link>
      <div className="ml-8 flex gap-1">
        {navItems.map(({ href, label }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
