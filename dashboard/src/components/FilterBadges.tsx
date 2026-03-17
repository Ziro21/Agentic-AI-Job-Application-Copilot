"use client";

interface FilterBadgesProps {
  isUk: boolean;
  isEntryLevel: boolean;
  isAiMl: boolean;
}

export function FilterBadges({ isUk, isEntryLevel, isAiMl }: FilterBadgesProps) {
  const badges = [
    { label: "UK", ok: isUk },
    { label: "Entry", ok: isEntryLevel },
    { label: "AI/ML", ok: isAiMl },
  ];

  return (
    <div className="flex gap-1">
      {badges.map(({ label, ok }) => (
        <span
          key={label}
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
            ok
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-700/50 text-zinc-500"
          }`}
          title={ok ? `Passed: ${label}` : `Did not pass: ${label}`}
        >
          {ok ? "✓" : "—"} {label}
        </span>
      ))}
    </div>
  );
}
