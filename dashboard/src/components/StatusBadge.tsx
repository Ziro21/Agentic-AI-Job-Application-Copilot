"use client";

import { getStatusConfig } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-medium ${config.pill}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
