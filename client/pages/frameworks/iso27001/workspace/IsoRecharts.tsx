import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ISO_CHART, ISO_CHART_SEQUENCE } from "./chartTheme";

export function ChartPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={"border-border/80 shadow-sm overflow-hidden " + (className ?? "")}>
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground font-normal mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="h-[260px] w-full min-h-[200px]">{children}</div>
      </CardContent>
    </Card>
  );
}

export function ReadinessBarChart({
  data,
  dataKey = "value",
  nameKey = "name",
}: {
  data: { name: string; value: number }[];
  dataKey?: string;
  nameKey?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} interval={0} angle={-28} textAnchor="end" height={56} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
          }}
        />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} fill={ISO_CHART.primary} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutDistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={52}
          outerRadius={84}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={ISO_CHART_SEQUENCE[i % ISO_CHART_SEQUENCE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
        <XAxis type="number" domain={[0, "dataMax"]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={ISO_CHART_SEQUENCE[i % ISO_CHART_SEQUENCE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
