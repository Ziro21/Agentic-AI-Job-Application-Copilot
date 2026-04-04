"use client";

interface FilterBadgesProps {
  isUk: boolean;
  isEntryLevel: boolean;
  isAiMl: boolean;
}

function CheckIcon() {
  return (
    <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 6l3 3 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 6h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
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
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${
            ok
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-zinc-700/30 bg-zinc-800/50 text-zinc-400"
          }`}
          title={ok ? `Passed: ${label}` : `Did not pass: ${label}`}
        >
          {ok ? <CheckIcon /> : <DashIcon />}
          {label}
        </span>
      ))}
    </div>
  );
}
