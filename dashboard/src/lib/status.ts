export interface StatusConfig {
  label: string;
  pill: string;
  border: string;
  dot: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  saved: {
    label: "Saved",
    pill: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/25",
    border: "border-l-indigo-500",
    dot: "bg-indigo-400",
  },
  applied: {
    label: "Applied",
    pill: "bg-sky-500/15 text-sky-400 border border-sky-500/25",
    border: "border-l-sky-500",
    dot: "bg-sky-400",
  },
  oa: {
    label: "Online Assessment",
    pill: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    border: "border-l-amber-500",
    dot: "bg-amber-400",
  },
  interview: {
    label: "Interview",
    pill: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
    border: "border-l-violet-500",
    dot: "bg-violet-400",
  },
  offer: {
    label: "Offer",
    pill: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    border: "border-l-emerald-500",
    dot: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-zinc-700/40 text-zinc-500 border border-zinc-700/30",
    border: "border-l-zinc-600",
    dot: "bg-zinc-600",
  },
  no_response: {
    label: "No Response",
    pill: "bg-zinc-800/40 text-zinc-400 border border-zinc-700/20",
    border: "border-l-zinc-700",
    dot: "bg-zinc-700",
  },
};

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.no_response;
}

// Ordered pipeline stages (linear flow)
export const PIPELINE_STAGES = ["saved", "applied", "oa", "interview", "offer"] as const;

// Statuses that exit the pipeline
export const EXIT_STATUSES = ["rejected", "no_response"] as const;
