import { ReactNode, useMemo } from "react";
import { FrameworkPill } from "./FrameworkPill";
import type { FrameworkModule } from "@/frameworks/types";

interface GroupEntry<T> {
  framework: FrameworkModule;
  records: T[];
}

export interface WithFramework<T> {
  frameworkId: string;
  frameworkName: string;
  framework: FrameworkModule;
  record: T;
}

/**
 * Renders a collection of records grouped by their source framework.
 * Each group has a header and delegates the per-record rendering to
 * the caller.
 */
export function GroupByFramework<T>({
  items,
  renderGroupBody,
  emptyState,
  groupMeta,
}: {
  items: WithFramework<T>[];
  renderGroupBody: (records: T[], framework: FrameworkModule) => ReactNode;
  emptyState?: ReactNode;
  groupMeta?: (records: T[], framework: FrameworkModule) => ReactNode;
}) {
  const groups = useMemo<GroupEntry<T>[]>(() => {
    const map = new Map<string, GroupEntry<T>>();
    items.forEach((entry) => {
      const existing = map.get(entry.frameworkId);
      if (existing) {
        existing.records.push(entry.record);
      } else {
        map.set(entry.frameworkId, {
          framework: entry.framework,
          records: [entry.record],
        });
      }
    });
    return Array.from(map.values());
  }, [items]);

  if (groups.length === 0) return <>{emptyState}</>;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div
          key={group.framework.id}
          className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <FrameworkPill framework={group.framework} linked />
              <span className="text-sm font-medium text-foreground">
                {group.framework.name}
              </span>
              <span className="text-xs text-muted-foreground">
                · {group.records.length} item
                {group.records.length === 1 ? "" : "s"}
              </span>
            </div>
            {groupMeta && (
              <div className="text-xs text-muted-foreground">
                {groupMeta(group.records, group.framework)}
              </div>
            )}
          </div>
          <div>{renderGroupBody(group.records, group.framework)}</div>
        </div>
      ))}
    </div>
  );
}
