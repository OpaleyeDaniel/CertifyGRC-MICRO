import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  GitCompareArrows,
  Info,
  Recycle,
  Layers,
  Zap,
  Search,
} from "lucide-react";
import {
  OmegaPage,
  OmegaSection,
  OmegaEmptyState,
} from "@/components/omega/OmegaPage";
import { KpiCard } from "@/components/omega/KpiCard";
import { FrameworkPill } from "@/components/omega/FrameworkPill";
import { REGISTERED_FRAMEWORKS } from "@/frameworks/registry";
import {
  CROSSWALK,
  buildOverlapMatrix,
  type CrosswalkEntry,
  type CrosswalkStrength,
} from "@/frameworks/crosswalk";
import {
  useAllEvidence,
  useAllGaps,
} from "@/frameworks/useFrameworkSummaries";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const strengthTone: Record<
  CrosswalkStrength,
  { chip: string; label: string }
> = {
  equivalent: {
    chip: "bg-emerald-500/15 text-emerald-700",
    label: "Equivalent",
  },
  partial: { chip: "bg-amber-500/15 text-amber-700", label: "Partial" },
  supports: { chip: "bg-sky-500/15 text-sky-700", label: "Supports" },
};

export default function OmegaCrossMapping() {
  const [source, setSource] = useState<string>("nist-csf");
  const [target, setTarget] = useState<string>("iso-27001");
  const [query, setQuery] = useState("");
  const evidence = useAllEvidence();
  const gaps = useAllGaps();

  const allFrameworkIds = useMemo(
    () => REGISTERED_FRAMEWORKS.map((f) => f.id),
    [],
  );

  const matrix = useMemo(
    () => buildOverlapMatrix(allFrameworkIds),
    [allFrameworkIds],
  );

  const pairMappings = useMemo<CrosswalkEntry[]>(() => {
    const mappings = CROSSWALK.filter(
      (entry) =>
        (entry.from.frameworkId === source &&
          entry.to.frameworkId === target) ||
        (entry.from.frameworkId === target &&
          entry.to.frameworkId === source),
    );
    // Normalise the edge direction so the source is always the "from" side.
    return mappings.map((entry) =>
      entry.from.frameworkId === source
        ? entry
        : {
            ...entry,
            from: entry.to,
            to: entry.from,
          },
    );
  }, [source, target]);

  const filteredMappings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairMappings;
    return pairMappings.filter(
      (m) =>
        m.from.controlId.toLowerCase().includes(q) ||
        m.to.controlId.toLowerCase().includes(q) ||
        (m.note ?? "").toLowerCase().includes(q),
    );
  }, [pairMappings, query]);

  const sourceFw = REGISTERED_FRAMEWORKS.find((f) => f.id === source);
  const targetFw = REGISTERED_FRAMEWORKS.find((f) => f.id === target);

  /* ------------- Shared-work insights ------------- */
  const reusableEvidence = useMemo(() => {
    // Evidence belonging to a control that participates in at least one
    // mapping edge.
    const evidenceByControl = new Set(
      CROSSWALK.flatMap((e) => [
        `${e.from.frameworkId}|${e.from.controlId}`,
        `${e.to.frameworkId}|${e.to.controlId}`,
      ]),
    );
    return evidence
      .filter((e) => {
        if (!e.record.controlId) return false;
        return evidenceByControl.has(
          `${e.frameworkId}|${e.record.controlId}`,
        );
      })
      .slice(0, 6);
  }, [evidence]);

  const sharedRemediationOpportunities = useMemo(() => {
    // Gaps whose underlying control is mapped to another framework ⇒
    // a single remediation may close gaps in both places.
    return gaps
      .map((g) => {
        const edges = CROSSWALK.filter(
          (e) =>
            (e.from.frameworkId === g.frameworkId &&
              e.from.controlId === g.record.controlId) ||
            (e.to.frameworkId === g.frameworkId &&
              e.to.controlId === g.record.controlId),
        );
        const otherFwIds = new Set<string>();
        edges.forEach((edge) => {
          const other =
            edge.from.frameworkId === g.frameworkId
              ? edge.to.frameworkId
              : edge.from.frameworkId;
          if (other !== g.frameworkId) otherFwIds.add(other);
        });
        return { gap: g, otherFwIds: Array.from(otherFwIds) };
      })
      .filter((x) => x.otherFwIds.length > 0)
      .slice(0, 6);
  }, [gaps]);

  return (
    <OmegaPage
      eyebrow="Omega · Framework crosswalk"
      title="Cross Mapping"
      description="Overlap between frameworks — reuse controls, evidence and remediation work across NIST CSF, ISO 27001 and PCI DSS."
      icon={<GitCompareArrows className="h-5 w-5" />}
    >
      {/* Key metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total mappings"
          value={CROSSWALK.length}
          icon={GitCompareArrows}
          tone="primary"
        />
        <KpiCard
          label="Equivalent"
          value={CROSSWALK.filter((c) => c.strength === "equivalent").length}
          tone="success"
        />
        <KpiCard
          label="Partial"
          value={CROSSWALK.filter((c) => c.strength === "partial").length}
          tone="warning"
        />
        <KpiCard
          label="Supports"
          value={CROSSWALK.filter((c) => c.strength === "supports").length}
          tone="info"
        />
      </div>

      {/* Overlap matrix */}
      <OmegaSection
        title="Overlap matrix"
        description="Number of mapped control edges between each pair of frameworks."
      >
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">From / To</th>
                {REGISTERED_FRAMEWORKS.map((fw) => (
                  <th
                    key={fw.id}
                    className="px-4 py-2 text-left font-semibold"
                  >
                    <FrameworkPill framework={fw} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {REGISTERED_FRAMEWORKS.map((rowFw) => (
                <tr key={rowFw.id}>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    <FrameworkPill framework={rowFw} />
                  </td>
                  {REGISTERED_FRAMEWORKS.map((colFw) => {
                    const count = matrix[rowFw.id]?.[colFw.id] ?? 0;
                    const isSelf = rowFw.id === colFw.id;
                    return (
                      <td
                        key={colFw.id}
                        className={cn(
                          "px-4 py-2.5 tabular-nums",
                          isSelf && "text-muted-foreground",
                        )}
                      >
                        {isSelf ? (
                          "—"
                        ) : count > 0 ? (
                          <button
                            onClick={() => {
                              setSource(rowFw.id);
                              setTarget(colFw.id);
                              setQuery("");
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary hover:bg-primary/20"
                          >
                            {count}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OmegaSection>

      {/* Framework-to-framework selector */}
      <OmegaSection
        title="Framework-to-framework mapping"
        description="Pick two frameworks to see which of their controls satisfy each other."
      >
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <FrameworkSelector
            label="From"
            value={source}
            onChange={setSource}
            excludeId={target}
          />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <FrameworkSelector
            label="To"
            value={target}
            onChange={setTarget}
            excludeId={source}
          />
          <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search control id or note…"
              className="h-6 w-56 border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </OmegaSection>

      <OmegaSection
        title={`Mapped controls (${filteredMappings.length})`}
        description={
          sourceFw && targetFw
            ? `${sourceFw.name} → ${targetFw.name}`
            : undefined
        }
      >
        {filteredMappings.length === 0 ? (
          <OmegaEmptyState
            title="No mappings between these frameworks yet"
            description="Edit client/frameworks/crosswalk.ts to add more edges — the matrix and page update automatically."
            icon={<Info className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">
                    {sourceFw?.name ?? "Source"} control
                  </th>
                  <th className="px-4 py-2 text-left font-semibold"></th>
                  <th className="px-4 py-2 text-left font-semibold">
                    {targetFw?.name ?? "Target"} control
                  </th>
                  <th className="px-4 py-2 text-left font-semibold">Strength</th>
                  <th className="px-4 py-2 text-left font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMappings.map((m, i) => (
                  <tr
                    key={`${m.from.controlId}-${m.to.controlId}-${i}`}
                    className="hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">
                      {m.from.controlId}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">
                      {m.to.controlId}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          strengthTone[m.strength].chip,
                        )}
                      >
                        {strengthTone[m.strength].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {m.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OmegaSection>

      {/* Reuse insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <OmegaSection
          title="Reusable evidence"
          description="Evidence uploaded in one framework that can be reused for mapped controls in another."
        >
          {reusableEvidence.length === 0 ? (
            <OmegaEmptyState
              title="Upload evidence to see reuse opportunities"
              icon={<Recycle className="h-5 w-5" />}
            />
          ) : (
            <div className="space-y-2">
              {reusableEvidence.map((e) => (
                <div
                  key={e.record.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm"
                >
                  <Recycle className="h-4 w-4 flex-none text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {e.record.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.record.controlId} · {e.frameworkName}
                    </div>
                  </div>
                  {e.record.href && (
                    <Link
                      to={e.record.href}
                      className="text-xs text-primary hover:underline"
                    >
                      Open
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </OmegaSection>

        <OmegaSection
          title="Shared remediation opportunities"
          description="A single remediation can close gaps in multiple frameworks where controls are mapped."
        >
          {sharedRemediationOpportunities.length === 0 ? (
            <OmegaEmptyState
              title="No shared opportunities yet"
              description="Once there are gaps on a mapped control, Omega will surface shared remediation opportunities."
              icon={<Zap className="h-5 w-5" />}
            />
          ) : (
            <div className="space-y-2">
              {sharedRemediationOpportunities.map(({ gap, otherFwIds }) => (
                <div
                  key={gap.record.id}
                  className="rounded-xl border border-border/60 bg-card p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <FrameworkPill framework={gap.framework} compact />
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {gap.record.controlId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      also satisfies:
                    </span>
                    {otherFwIds.map((id) => {
                      const fw = REGISTERED_FRAMEWORKS.find((f) => f.id === id);
                      if (!fw) return null;
                      return <FrameworkPill key={id} framework={fw} linked />;
                    })}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {gap.record.title}
                  </p>
                  <Link
                    to={gap.record.href}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open gap <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </OmegaSection>
      </div>

      <OmegaSection title="How to extend the crosswalk">
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/70 bg-card/40 p-4 text-sm text-muted-foreground">
          <Layers className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <p>
              All mapping edges are defined in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                client/frameworks/crosswalk.ts
              </code>
              . Add an entry and it will surface automatically in the overlap
              matrix, the mappings table, evidence reuse and shared remediation
              views.
            </p>
          </div>
        </div>
      </OmegaSection>
    </OmegaPage>
  );
}

function FrameworkSelector({
  label,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  excludeId?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {REGISTERED_FRAMEWORKS.filter((fw) => fw.id !== excludeId).map((fw) => (
          <option key={fw.id} value={fw.id}>
            {fw.name}
          </option>
        ))}
      </select>
    </label>
  );
}
