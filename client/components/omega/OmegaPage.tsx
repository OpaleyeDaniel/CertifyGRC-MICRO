import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OmegaPageProps {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Canonical header + content wrapper used by every Omega global page.
 * Keeps page-level chrome (title, subtitle, actions) consistent.
 */
export function OmegaPage({
  title,
  eyebrow,
  description,
  icon,
  actions,
  children,
  className,
}: OmegaPageProps) {
  return (
    <div
      className={cn(
        "min-h-full space-y-6 bg-background bg-gradient-to-b from-primary/[0.045] from-0% to-background to-32% p-6 md:p-8",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-b border-border/50 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-card/90 text-primary shadow-sm ring-1 ring-primary/5 backdrop-blur-sm">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-3xl text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function OmegaSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function OmegaEmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center">
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div>
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
