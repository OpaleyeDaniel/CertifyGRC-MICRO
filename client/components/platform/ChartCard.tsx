import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
};

/** Chart wrapper: consistent title, description, and padding for Recharts and other visualizations. */
export function ChartCard({ title, description, className, action, children }: Props) {
  return (
    <Card className={cn("overflow-hidden border-border/60 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
