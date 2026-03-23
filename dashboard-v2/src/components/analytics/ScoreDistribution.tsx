"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { JobListItem } from "@/lib/types";

interface ScoreDistributionProps {
  jobs: JobListItem[];
}

export function ScoreDistribution({ jobs }: ScoreDistributionProps) {
  const data = useMemo(() => {
    const bands = Array.from({ length: 10 }, (_, i) => ({
      band: `${i * 10}-${(i + 1) * 10}`,
      count: 0,
    }));

    for (const job of jobs) {
      const idx = Math.min(Math.floor(job.match_score / 10), 9);
      bands[idx].count++;
    }

    return bands;
  }, [jobs]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="band"
            tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #262626",
              borderRadius: 8,
              fontSize: 12,
              color: "#a1a1aa",
            }}
            formatter={(value) => [`${value} jobs`, "Count"]}
            labelFormatter={(label) => `Score ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
