/** Recharts-friendly colors aligned with CertifyGRC CSS variables (see `client/global.css`). */
export const ISO_CHART = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
} as const;

export const ISO_CHART_SEQUENCE = [
  ISO_CHART.primary,
  ISO_CHART.accent,
  ISO_CHART.success,
  ISO_CHART.warning,
  ISO_CHART.destructive,
  ISO_CHART.muted,
] as const;
