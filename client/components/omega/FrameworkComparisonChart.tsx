import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { FrameworkModule, FrameworkSummary } from "@/frameworks/types";
import { cn } from "@/lib/utils";

type Row = { framework: FrameworkModule; summary: FrameworkSummary };

type Props = { rows: Row[]; className?: string };

/**
 * Grouped bar chart: assessment % vs audit readiness % per framework. Uses only live summary data.
 */
export function FrameworkComparisonChart({ rows, className }: Props) {
  const data = useMemo(() => {
    return rows.map(({ framework, summary }) => ({
      name: framework.shortCode.toUpperCase(),
      longName: framework.name,
      progress: Math.round(summary.assessmentProgress ?? 0),
      readiness: Math.round(summary.readinessScore ?? 0),
    }));
  }, [rows]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 text-sm text-muted-foreground",
          className,
        )}
      >
        Add or activate a framework to see a comparison.
      </div>
    );
  }

  return (
    <div className={cn("h-[min(360px,50vh)] w-full min-w-0", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[11px] fill-muted-foreground" />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            className="text-[11px] fill-muted-foreground"
            width={32}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[0];
              return (
                <div className="rounded-lg border border-border/80 bg-background/95 p-2 text-xs shadow-md backdrop-blur">
                  <p className="font-semibold text-foreground">{p.longName}</p>
                  {payload.map((it) => (
                    <p key={String(it.dataKey)} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{it.name}:</span> {it.value}%
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="progress" name="Assessment %" fill="hsl(213, 93%, 45%)" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar
            dataKey="readiness"
            name="Readiness %"
            fill="#10b981"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
