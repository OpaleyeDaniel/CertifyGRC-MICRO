import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, Search, AlertCircle } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading, StatusPill, formatBytes, formatRelative, EmptyState } from "./_shared";
import { useIsoEvidence } from "@/frameworks/iso27001/hooks/useIsoEvidence";
import { useIsoAssessment } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import { ANNEX_A } from "@/frameworks/iso27001/data";
import { ChartPanel, DonutDistributionChart, HorizontalBarChart } from "./workspace/IsoRecharts";

const controlChoices = ANNEX_A.flatMap((g) => g.controls.map((c) => ({ ref: c.reference, label: `${c.reference} — ${c.name}` })));

export default function IsoEvidence() {
  const { files, updateFile, remove, metrics } = useIsoEvidence();
  const { allApplicableQuestions } = useIsoAssessment();
  const [query, setQuery] = useState("");
  const [flag, setFlag] = useState<string>("all");

  const coveragePct = allApplicableQuestions.length
    ? Math.round(
        (allApplicableQuestions.filter((q) => (q.state.evidence?.length ?? 0) > 0).length /
          allApplicableQuestions.length) *
          100,
      )
    : 0;

  const reviewChart = useMemo(() => {
    const m: Record<string, number> = {};
    files.forEach((f) => {
      const s = f.reviewStatus ?? "unreviewed";
      m[s] = (m[s] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [files]);

  const typeChart = useMemo(() => {
    const m: Record<string, number> = {};
    files.forEach((f) => {
      const t = f.type || "unknown";
      const cat = t.startsWith("image/") ? "Images" : t.includes("pdf") ? "PDF" : t.startsWith("text/") ? "Text" : "Other";
      m[cat] = (m[cat] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [files]);

  const controlLinkChart = useMemo(() => {
    const m = new Map<string, number>();
    files.forEach((f) => {
      f.linkedControls.forEach((c) => m.set(c, (m.get(c) ?? 0) + 1));
    });
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [files]);

  const recentFiles = useMemo(
    () =>
      [...files]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 6),
    [files],
  );

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (query && !f.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (flag === "unreviewed" && f.reviewStatus !== "unreviewed") return false;
      if (flag === "rejected" && f.reviewStatus !== "rejected") return false;
      if (flag === "orphan" && (f.linkedQuestions.length > 0 || f.linkedControls.length > 0)) return false;
      return true;
    });
  }, [files, query, flag]);

  return (
    <IsoPage
      title="Evidence library"
      description="Central evidence register for audit traceability: map artefacts to assessment questions and Annex A controls, monitor review decisions, ageing, and coverage against applicable requirements."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-56"
              placeholder="Search files…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={flag} onValueChange={setFlag}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All files</SelectItem>
              <SelectItem value="unreviewed">Unreviewed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="orphan">Unlinked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard label="Total files" value={metrics.total} />
        <MetricCard
          label="Question coverage"
          value={`${coveragePct}%`}
          hint="Applicable Qs with evidence"
          tone={coveragePct >= 70 ? "success" : coveragePct >= 40 ? "warning" : "danger"}
        />
        <MetricCard label="Unreviewed" value={metrics.unreviewed} tone={metrics.unreviewed ? "warning" : "success"} />
        <MetricCard label="Rejected" value={metrics.rejected} tone={metrics.rejected ? "danger" : "success"} />
        <MetricCard label="Unlinked" value={metrics.unlinked} tone={metrics.unlinked ? "warning" : "success"} />
        <MetricCard label="Stale (&gt;180d)" value={metrics.stale} tone={metrics.stale ? "warning" : "success"} />
        <MetricCard label="Storage" value={formatBytes(metrics.totalBytes)} />
      </div>

      {(metrics.unreviewed > 0 || metrics.stale > 0 || metrics.unlinked > 0) && (
        <Card className="border-amber-200/70 dark:border-amber-900/50 bg-amber-500/[0.04]">
          <CardHeader className="pb-2">
            <SectionHeading
              title="Evidence requiring attention"
              subtitle="Prioritise reviewer throughput and linkage before external audit sampling."
              right={<AlertCircle className="h-5 w-5 text-amber-600" />}
            />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {metrics.unreviewed > 0 && <StatusPill label={`${metrics.unreviewed} unreviewed`} tone="warning" />}
            {metrics.rejected > 0 && <StatusPill label={`${metrics.rejected} rejected`} tone="danger" />}
            {metrics.unlinked > 0 && <StatusPill label={`${metrics.unlinked} unlinked`} tone="warning" />}
            {metrics.stale > 0 && <StatusPill label={`${metrics.stale} stale uploads`} tone="warning" />}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel title="Review outcomes" subtitle="Accept / reject / pending across the library">
          {reviewChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No files yet</div>
          ) : (
            <DonutDistributionChart data={reviewChart} />
          )}
        </ChartPanel>
        <ChartPanel title="File categories" subtitle="Grouped by MIME family (approximate)">
          {typeChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No files yet</div>
          ) : (
            <DonutDistributionChart data={typeChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Top linked controls" subtitle="Where artefacts are anchored in Annex A">
          {controlLinkChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No control links yet</div>
          ) : (
            <HorizontalBarChart data={controlLinkChart} />
          )}
        </ChartPanel>
      </div>

      {recentFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeading title="Recent uploads" subtitle="Latest artefacts added to the register" />
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentFiles.map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatBytes(f.sizeBytes)} · {formatRelative(f.uploadedAt)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <StatusPill
                    label={f.reviewStatus ?? "unreviewed"}
                    tone={
                      f.reviewStatus === "accepted"
                        ? "success"
                        : f.reviewStatus === "rejected"
                          ? "danger"
                          : "warning"
                    }
                  />
                  {f.linkedControls.length === 0 && f.linkedQuestions.length === 0 && (
                    <StatusPill label="Unlinked" tone="warning" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <SectionHeading
            title="Evidence items"
            subtitle="Accept or reject artefacts; map to Annex A controls for audit traceability."
          />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Archive className="h-10 w-10 opacity-50" />}
              title="No evidence matches"
              description="Adjust search or filters, or upload from assessment questions."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Linked</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {f.linkedControls.slice(0, 3).map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px]">
                            {c}
                          </Badge>
                        ))}
                        {f.linkedControls.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{f.linkedControls.length - 3}</span>
                        )}
                        {f.linkedControls.length === 0 && f.linkedQuestions.length === 0 && (
                          <StatusPill label="Unlinked" tone="warning" />
                        )}
                      </div>
                      <Select
                        value={f.linkedControls[0] ?? "_none"}
                        onValueChange={(v) => {
                          if (v === "_none") return;
                          updateFile(f.id, {
                            linkedControls: Array.from(new Set([...f.linkedControls, v])),
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 mt-2 w-full max-w-[220px] text-xs">
                          <SelectValue placeholder="Link control" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Link control…</SelectItem>
                          {controlChoices.map((c) => (
                            <SelectItem key={c.ref} value={c.ref}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={f.reviewStatus ?? "unreviewed"}
                        onValueChange={(v) =>
                          updateFile(f.id, { reviewStatus: v as "unreviewed" | "accepted" | "rejected" })
                        }
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unreviewed">Unreviewed</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatRelative(f.uploadedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => remove(f.id)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </IsoPage>
  );
}
