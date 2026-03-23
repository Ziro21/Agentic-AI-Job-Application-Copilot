import { cn, scoreColor } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const colors = scoreColor(score);
  const dimensions = size === "lg" ? 56 : 32;
  const strokeWidth = size === "lg" ? 3 : 2.5;
  const radius = (dimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      title={`Match score: ${score}/100`}
    >
      <svg
        width={dimensions}
        height={dimensions}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-800"
        />
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono font-bold",
          colors.text,
          size === "lg" ? "text-sm" : "text-[10px]"
        )}
      >
        {score}
      </span>
    </div>
  );
}
