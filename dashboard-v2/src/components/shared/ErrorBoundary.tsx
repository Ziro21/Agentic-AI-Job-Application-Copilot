"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorProps {
  error: Error | null;
  onRetry: () => void;
}

export function QueryError({ error, onRetry }: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-xl bg-red-500/10 p-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mb-1 text-sm font-medium text-zinc-300">
        Something went wrong
      </h3>
      <p className="mb-6 max-w-xs font-mono text-xs text-zinc-500">
        {error?.message ?? "Unknown error"}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
