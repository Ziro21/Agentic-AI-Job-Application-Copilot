import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendData } from "@/lib/types";

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  trend?: TrendData;
  className?: string;
}

export function StatCard({ label, value, sublabel, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4",
        className
      )}
    >
      <div className="font-mono text-2xl font-bold text-zinc-100">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
      {sublabel && (
        <div className="mt-1 font-mono text-[10px] text-zinc-600">
          {sublabel}
        </div>
      )}
      {trend && (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 font-mono text-[10px]",
            trend.direction === "up" && "text-emerald-500",
            trend.direction === "down" && "text-red-400",
            trend.direction === "neutral" && "text-zinc-600"
          )}
        >
          {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
          {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
          {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
          <span>
            {trend.direction === "up" && "+"}
            {trend.value} {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
