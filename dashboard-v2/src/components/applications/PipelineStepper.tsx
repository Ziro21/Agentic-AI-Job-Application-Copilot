"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, EXIT_STATUSES, getStatusConfig } from "@/lib/status";
import { Button } from "@/components/ui/button";

interface PipelineStepperProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  isLoading?: boolean;
}

export function PipelineStepper({
  currentStatus,
  onStatusChange,
  isLoading,
}: PipelineStepperProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStatus as typeof PIPELINE_STAGES[number]);

  return (
    <div className="space-y-4">
      {/* Pipeline stages */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {PIPELINE_STAGES.map((stage, i) => {
          const config = getStatusConfig(stage);
          const isActive = stage === currentStatus;
          const isPast = currentIndex >= 0 && i < currentIndex;
          const isExit = EXIT_STATUSES.includes(currentStatus as typeof EXIT_STATUSES[number]);

          return (
            <div key={stage} className="flex items-center">
              <button
                onClick={() => onStatusChange(stage)}
                disabled={isLoading}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-all",
                  isActive && !isExit
                    ? config.pill
                    : isPast
                    ? "bg-zinc-800/50 text-zinc-400"
                    : "border border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                )}
              >
                {config.shortLabel}
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-zinc-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Exit actions */}
      <div className="flex items-center gap-2">
        {EXIT_STATUSES.map((status) => {
          const config = getStatusConfig(status);
          const isActive = status === currentStatus;

          return (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(status)}
              disabled={isLoading}
              className={cn(
                "h-7 cursor-pointer px-2.5 text-[10px]",
                isActive
                  ? config.pill
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {config.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
