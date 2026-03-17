"use client";

export function ScoreBadge({ score }: { score: number }) {
  const { ring, text, bg } =
    score >= 70
      ? {
          ring: "ring-emerald-500/40",
          text: "text-emerald-400",
          bg: "bg-emerald-500/10",
        }
      : score >= 50
        ? {
            ring: "ring-amber-500/40",
            text: "text-amber-400",
            bg: "bg-amber-500/10",
          }
        : {
            ring: "ring-red-500/30",
            text: "text-red-400",
            bg: "bg-red-500/10",
          };

  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded px-2 py-0.5 font-mono text-sm font-bold ring-1 ${bg} ${text} ${ring}`}
      title={`Match score: ${score}/100`}
    >
      {score}
      <span className="text-[10px] font-normal opacity-50">/100</span>
    </span>
  );
}
