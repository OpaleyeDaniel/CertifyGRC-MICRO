import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  Filter,
  MessageSquare,
  Undo2,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkFilter } from "@/components/omega/FrameworkFilter";
import { GroupByFramework } from "@/components/omega/GroupByFramework";
import {
  StatusBadge,
  reviewTone,
} from "@/components/omega/StatusBadge";
import {
  useAllReviews,
  useFrameworkSummaries,
} from "@/frameworks/useFrameworkSummaries";
import type { FrameworkReviewRecord } from "@/frameworks/types";

type StatusFilter = "all" | FrameworkReviewRecord["reviewStatus"];

const STATUSES: StatusFilter[] = [
  "all",
  "pending",
  "revision-requested",
  "approved",
];

function fmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "—";
}

export default function OmegaReview() {
  const reviews = useAllReviews();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (frameworkId !== "all" && r.frameworkId !== frameworkId) return false;
      if (status !== "all" && r.record.reviewStatus !== status) return false;
      return true;
    });
  }, [reviews, frameworkId, status]);

  const stats = useMemo(() => {
    const pending = reviews.filter(
      (r) => r.record.reviewStatus === "pending",
    ).length;
    const approved = reviews.filter(
      (r) => r.record.reviewStatus === "approved",
    ).length;
    const revisionRequested = reviews.filter(
      (r) => r.record.reviewStatus === "revision-requested",
    ).length;
    const unresolvedComments = reviews.reduce(
      (sum, r) =>
        sum + (r.record.reviewStatus === "pending" ? r.record.commentCount : 0),
      0,
    );
    return { pending, approved, revisionRequested, unresolvedComments };
  }, [reviews]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reviews.forEach((r) => {
      counts[r.frameworkId] = (counts[r.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [reviews]);

  return (
    <OmegaPage
      eyebrow="Omega · Collaboration"
      title="Comment & Review"
      description="Every review and comment thread across all frameworks — pending auditor approvals, revisions and open collaboration items."
      icon={<MessageSquare className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Pending review"
          value={stats.pending}
          tone={stats.pending > 0 ? "warning" : "default"}
          icon={MessageSquare}
        />
        <KpiCard
          label="Revision requested"
          value={stats.revisionRequested}
          tone={stats.revisionRequested > 0 ? "danger" : "default"}
          icon={Undo2}
        />
        <KpiCard
          label="Approved"
          value={stats.approved}
          tone="success"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Unresolved comments"
          value={stats.unresolvedComments}
          tone={stats.unresolvedComments > 0 ? "warning" : "default"}
        />
      </div>

      <OmegaSection title="Filter">
        <div className="flex flex-wrap items-center gap-3">
          <FrameworkFilter
            frameworks={entries
              .filter((e) => e.summary)
              .map(({ framework }) => framework)}
            value={frameworkId}
            onChange={setFrameworkId}
            counts={frameworkCounts}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  status === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s === "all" ? "All" : s.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title={`Reviews (${filtered.length})`}>
        <GroupByFramework
          items={filtered}
          emptyState={
            <OmegaEmptyState
              title="No open reviews"
              description="Submit a control for review inside a framework workspace — it will appear here."
              icon={<MessageSquare className="h-5 w-5" />}
            />
          }
          groupMeta={(records) => {
            const pending = records.filter(
              (r) => r.reviewStatus === "pending",
            ).length;
            return `${pending} pending · ${records.length} total`;
          }}
          renderGroupBody={(records) => (
            <ul className="divide-y divide-border/60">
              {records.slice(0, 80).map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-4 px-4 py-3 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {r.controlId}
                      </span>
                      <StatusBadge
                        label={r.reviewStatus}
                        tone={reviewTone(r.reviewStatus)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {r.domain}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-foreground">
                      {r.title}
                    </p>
                    {r.lastComment && (
                      <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                        "{r.lastComment}"
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Submitted {fmt(r.submittedAt)}</span>
                      {r.resolvedAt && <span>Resolved {fmt(r.resolvedAt)}</span>}
                      {r.commentCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {r.commentCount}{" "}
                          comment{r.commentCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={r.href}
                    className="inline-flex items-center gap-1 self-center text-xs font-medium text-primary hover:underline"
                  >
                    Open <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        />
      </OmegaSection>
    </OmegaPage>
  );
}
