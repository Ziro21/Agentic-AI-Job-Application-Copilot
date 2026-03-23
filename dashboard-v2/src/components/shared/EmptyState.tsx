"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "inline";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-8 text-center">
        <Icon className="mb-2 h-5 w-5 text-zinc-700" />
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-xl bg-zinc-900 p-4">
        <Icon className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="mb-1 text-sm font-medium text-zinc-300">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-zinc-500">{description}</p>
      <div className={cn("flex items-center gap-2", !action && !secondaryAction && "hidden")}>
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="cursor-pointer"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="ghost"
            size="sm"
            onClick={secondaryAction.onClick}
            className="cursor-pointer text-zinc-500"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
