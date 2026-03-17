"use client";

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : score >= 50
        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
        : "bg-red-500/20 text-red-400 border-red-500/40";

  return (
    <span
      className={`inline-flex items-center justify-center rounded border px-2 py-0.5 font-mono text-sm font-medium ${color}`}
      title={`Match score: ${score}/100`}
    >
      {score}
    </span>
  );
}
