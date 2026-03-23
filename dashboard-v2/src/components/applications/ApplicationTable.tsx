"use client";

import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { getStatusConfig, ALL_STATUSES } from "@/lib/status";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ApplicationWithJob } from "@/lib/types";

interface ApplicationTableProps {
  applications: ApplicationWithJob[];
  onStatusChange: (jobId: string, newStatus: string) => void;
  isLoading?: boolean;
}

export function ApplicationTable({
  applications,
  onStatusChange,
  isLoading,
}: ApplicationTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800/50 hover:bg-transparent">
            <TableHead className="text-zinc-500">Job Title</TableHead>
            <TableHead className="text-zinc-500">Company</TableHead>
            <TableHead className="text-zinc-500">Score</TableHead>
            <TableHead className="text-zinc-500">Status</TableHead>
            <TableHead className="text-zinc-500">Applied</TableHead>
            <TableHead className="text-zinc-500">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const config = getStatusConfig(app.status);
            return (
              <TableRow
                key={app.id}
                className="border-zinc-800/30 hover:bg-zinc-900/30"
              >
                <TableCell>
                  <Link
                    href={`/jobs/${app.job_id}`}
                    className="cursor-pointer text-sm text-zinc-200 hover:text-white"
                  >
                    {app.job_title ?? "Unknown"}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {app.company_name ?? "—"}
                </TableCell>
                <TableCell>
                  {app.match_score != null && (
                    <ScoreBadge score={app.match_score} size="sm" />
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={app.status}
                    onValueChange={(v) => v && onStatusChange(app.job_id, v)}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-7 w-[140px] cursor-pointer border-0 text-[10px] font-medium",
                        config.pill
                      )}
                    >
                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${config.dot}`} />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((status) => {
                        const sc = getStatusConfig(status);
                        return (
                          <SelectItem
                            key={status}
                            value={status}
                            className="cursor-pointer text-xs"
                          >
                            <span className="flex items-center gap-2">
                              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-500">
                  {formatDate(app.applied_at)}
                </TableCell>
                <TableCell>
                  {app.notes ? (
                    <Tooltip>
                      <TooltipTrigger className="max-w-[160px] cursor-default truncate text-xs text-zinc-500">
                        {app.notes}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{app.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-xs text-zinc-700">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
