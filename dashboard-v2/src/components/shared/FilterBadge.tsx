import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBadgeProps {
  label: string;
  passed: boolean;
}

export function FilterBadge({ label, passed }: FilterBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
        passed
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-zinc-800/50 text-zinc-500 border border-zinc-700/20"
      )}
    >
      {passed ? (
        <Check className="h-2.5 w-2.5" />
      ) : (
        <Minus className="h-2.5 w-2.5" />
      )}
      {label}
    </span>
  );
}
