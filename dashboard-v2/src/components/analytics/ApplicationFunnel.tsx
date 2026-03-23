"use client";

import type { Props as LabelProps } from "recharts/types/component/Label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PIPELINE_STAGES, getStatusConfig } from "@/lib/status";
import type { ApplicationWithJob } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  saved: "#6366f1",
  applied: "#0ea5e9",
  oa: "#f59e0b",
  interview: "#a78bfa",
  offer: "#10b981",
};

interface ApplicationFunnelProps {
  applications: ApplicationWithJob[];
}

export function ApplicationFunnel({ applications }: ApplicationFunnelProps) {
  const data = PIPELINE_STAGES.map((stage) => {
    const config = getStatusConfig(stage);
    const count = applications.filter((a) => a.status === stage).length;
    return {
      name: config.shortLabel,
      count,
      fill: STATUS_COLORS[stage] ?? "#6366f1",
    };
  });

  // Compute conversion rates between adjacent stages
  const conversionRates = data.map((d, i) => {
    if (i === 0 || data[i - 1].count === 0) return null;
    return Math.round((d.count / data[i - 1].count) * 100);
  });

  const total = applications.length || 1;

  function renderConversionLabel(props: LabelProps & { index?: number }) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const w = Number(props.width ?? 0);
    const h = Number(props.height ?? 0);
    const idx = props.index ?? 0;
    const rate = conversionRates[idx];
    if (rate == null) return <text />;
    return (
      <text
        x={x + w + 6}
        y={y + h / 2}
        fill="#71717a"
        fontSize={9}
        fontFamily="monospace"
        dominantBaseline="middle"
      >
        {rate}%
      </text>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={70}
            tick={{ fill: "#71717a", fontSize: 11, fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #262626",
              borderRadius: 8,
              fontSize: 12,
              color: "#a1a1aa",
            }}
            formatter={(value) => [
              `${value} (${Math.round((Number(value) / total) * 100)}%)`,
              "Count",
            ]}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            barSize={20}
            label={renderConversionLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
