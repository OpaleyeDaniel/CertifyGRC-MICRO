import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FolderOpen,
  Search,
  Recycle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkFilter } from "@/components/omega/FrameworkFilter";
import { GroupByFramework } from "@/components/omega/GroupByFramework";
import { FrameworkPill } from "@/components/omega/FrameworkPill";
import {
  useAllEvidence,
  useFrameworkSummaries,
} from "@/frameworks/useFrameworkSummaries";
import { getCrosswalkFor } from "@/frameworks/crosswalk";
import { REGISTERED_FRAMEWORKS } from "@/frameworks/registry";
import type { FrameworkEvidenceRecord } from "@/frameworks/types";
import { Input } from "@/components/ui/input";

function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "—";
}

export default function OmegaEvidence() {
  const evidence = useAllEvidence();
  const entries = useFrameworkSummaries();
  const [frameworkId, setFrameworkId] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidence.filter((e) => {
      if (frameworkId !== "all" && e.frameworkId !== frameworkId) return false;
      if (!q) return true;
      return (
        e.record.name.toLowerCase().includes(q) ||
        (e.record.controlId || "").toLowerCase().includes(q) ||
        (e.record.controlTitle || "").toLowerCase().includes(q)
      );
    });
  }, [evidence, frameworkId, query]);

  const stats = useMemo(() => {
    const total = evidence.length;
    const stale = evidence.filter((e) => e.record.stale).length;
    const assessment = evidence.filter(
      (e) => e.record.source === "assessment",
    ).length;
    const remediation = evidence.filter(
      (e) => e.record.source === "remediation",
    ).length;
    const external = evidence.filter((e) => e.record.source === "external").length;
    return { total, stale, assessment, remediation, external };
  }, [evidence]);

  const reusable = useMemo(() => {
    // Evidence whose source control has at least one crosswalk edge to
    // another framework = candidates for reuse in that other framework.
    const results: Array<{
      evidence: FrameworkEvidenceRecord;
      fromFramework: string;
      fromFrameworkName: string;
      suggestions: string[];
    }> = [];
    evidence.forEach(({ record, framework }) => {
      if (!record.controlId) return;
      const edges = getCrosswalkFor(framework.id, record.controlId);
      const suggestionSet = new Set<string>();
      edges.forEach((edge) => {
        const other =
          edge.from.frameworkId === framework.id
            ? edge.to.frameworkId
            : edge.from.frameworkId;
        if (other !== framework.id) suggestionSet.add(other);
      });
      if (suggestionSet.size > 0) {
        results.push({
          evidence: record,
          fromFramework: framework.id,
          fromFrameworkName: framework.name,
          suggestions: Array.from(suggestionSet),
        });
      }
    });
    return results.slice(0, 8);
  }, [evidence]);

  const frameworkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    evidence.forEach((e) => {
      counts[e.frameworkId] = (counts[e.frameworkId] ?? 0) + 1;
    });
    return counts;
  }, [evidence]);

  const missingEvidenceByFw = useMemo(() => {
    return entries
      .filter((e) => e.summary)
      .map(({ framework, summary }) => ({
        framework,
        missing: summary!.auditReadiness.missingEvidence,
        coverage: summary!.evidenceCoverage,
      }));
  }, [entries]);

  return (
    <OmegaPage
      eyebrow="Omega · Evidence library"
      title="Evidence"
      description="All evidence catalogued across every framework — reusable artefacts, coverage gaps and stale items."
      icon={<FolderOpen className="h-5 w-5" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total artefacts" value={stats.total} tone="primary" icon={FolderOpen} />
        <KpiCard label="From assessment" value={stats.assessment} tone="info" />
        <KpiCard label="From remediation" value={stats.remediation} tone="info" />
        <KpiCard label="Cloud / linked" value={stats.external} tone="info" />
        <KpiCard
          label="Stale (>180 days)"
          value={stats.stale}
          tone={stats.stale > 0 ? "warning" : "default"}
          icon={AlertTriangle}
        />
      </div>

      <OmegaSection
        title="Coverage by framework"
        description="Percentage of controls with at least one evidence artefact."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {missingEvidenceByFw.map(({ framework, missing, coverage }) => (
            <div
              key={framework.id}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {framework.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {missing} assessed control{missing === 1 ? "" : "s"} without
                  evidence
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tabular-nums text-primary">
                  {coverage === null ? "—" : `${coverage}%`}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Coverage
                </div>
              </div>
            </div>
          ))}
        </div>
      </OmegaSection>

      <OmegaSection
        title="Reusable evidence suggestions"
        description="Artefacts in one framework that may satisfy mapped controls in another framework via the Omega crosswalk."
      >
        {reusable.length === 0 ? (
          <OmegaEmptyState
            title="No reuse opportunities detected"
            description="Upload evidence in a framework with crosswalk mappings (see Cross Mapping) to see reuse suggestions here."
            icon={<Recycle className="h-5 w-5" />}
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {reusable.map((item) => {
              const fromFw = REGISTERED_FRAMEWORKS.find(
                (f) => f.id === item.fromFramework,
              );
              return (
                <div
                  key={item.evidence.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <Recycle className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {item.evidence.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.evidence.controlId} · {item.fromFrameworkName}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Could satisfy mapped controls in:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.suggestions.map((id) => {
                      const fw = REGISTERED_FRAMEWORKS.find((f) => f.id === id);
                      if (!fw) return null;
                      return (
                        <FrameworkPill key={id} framework={fw} linked />
                      );
                    })}
                  </div>
                  {fromFw && (
                    <Link
                      to="/cross-mapping"
                      className="mt-1 inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
                    >
                      View mapping <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </OmegaSection>

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
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search evidence…"
              className="h-6 border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </OmegaSection>

      <OmegaSection title={`Evidence (${filtered.length})`}>
        <GroupByFramework
          items={filtered}
          emptyState={
            <OmegaEmptyState
              title="No evidence uploaded yet"
              description="Upload files while answering controls or while remediating gaps."
              icon={<FolderOpen className="h-5 w-5" />}
            />
          }
          renderGroupBody={(records) => (
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">File</th>
                  <th className="px-4 py-2 text-left font-semibold">Control</th>
                  <th className="px-4 py-2 text-left font-semibold">Source</th>
                  <th className="px-4 py-2 text-left font-semibold">Size</th>
                  <th className="px-4 py-2 text-left font-semibold">Uploaded</th>
                  <th className="px-4 py-2 text-right font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.slice(0, 80).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="truncate font-medium text-foreground">
                        {r.name}
                        {r.stale && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            stale
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {r.controlTitle || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      {r.controlId || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      <span className="capitalize">{r.source}</span>
                      {r.cloudProviderLabel && (
                        <span className="mt-0.5 block text-[10px] text-primary/90">
                          {r.evidenceMode === "link" ? "Link · " : "Import · "}
                          {r.cloudProviderLabel}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {fmtSize(r.sizeBytes)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {fmtDate(r.uploadedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {r.href ? (
                        <Link
                          to={r.href}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />
      </OmegaSection>
    </OmegaPage>
  );
}
