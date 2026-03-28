import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NIST_FUNCTIONS = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"];

// Professional muted color palette for GRC dashboard
const NIST_COLORS: Record<string, string> = {
  GOVERN: "#64748b", // Slate (Governance)
  IDENTIFY: "#0ea5e9", // Sky Blue (Identification)
  PROTECT: "#06b6d4", // Cyan (Protection)
  DETECT: "#14b8a6", // Teal (Detection)
  RESPOND: "#3b82f6", // Blue (Response)
  RECOVER: "#8b5cf6", // Violet (Recovery)
};

interface EvidencePieChartProps {
  metrics: Record<string, number>;
}

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: string;
  count: number;
}

export function EvidencePieChart({ metrics }: EvidencePieChartProps) {
  // Prepare chart data
  const chartData = useMemo(() => {
    const total = Object.values(metrics).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return [];
    }

    return NIST_FUNCTIONS.map((func) => {
      const count = metrics[func] || 0;
      const percentage = ((count / total) * 100).toFixed(1);

      return {
        name: func,
        value: count,
        percentage,
        count,
      };
    }).filter((item) => item.value > 0);
  }, [metrics]);

  // Custom tooltip to show exact count
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-white border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-primary font-bold">{data.count} Files</p>
          <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend to show function name and percentage
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-col gap-3">
        {payload.map((entry: any, index: number) => {
          const data = chartData[index];
          return (
            <div key={`legend-${entry.value}`} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data?.count} file{data?.count !== 1 ? "s" : ""} ({data?.percentage}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Empty state
  if (chartData.length === 0) {
    return (
      <Card className="shadow-sm border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Evidence Distribution by NIST Function</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-center">
              No evidence data available. Upload evidence files to see distribution.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Evidence Distribution by NIST Function</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="40%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={NIST_COLORS[entry.name]}
                    style={{ opacity: 0.9 }}
                  />
                ))}
              </Pie>

              {/* Tooltip for hover effect */}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
              />

              {/* Legend on the right */}
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                content={<CustomLegend />}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats below chart */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-border pt-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Evidence</p>
            <p className="text-2xl font-bold text-foreground">
              {chartData.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Functions Covered</p>
            <p className="text-2xl font-bold text-foreground">{chartData.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Avg. per Function</p>
            <p className="text-2xl font-bold text-foreground">
              {(chartData.reduce((sum, item) => sum + item.count, 0) / chartData.length).toFixed(0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
