import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Shield } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading, StatusPill } from "./_shared";
import { useIsoRisks, scoreToLevel } from "@/frameworks/iso27001/hooks/useIsoRisks";
import { ChartPanel, DonutDistributionChart, HorizontalBarChart } from "./workspace/IsoRecharts";
import type { RiskEntry } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ANNEX_A } from "@/frameworks/iso27001/data";

const LEVEL_TONE = {
  CRITICAL: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "success",
} as const;

const defaultDraft: Omit<RiskEntry, "id" | "createdAt" | "updatedAt" | "inherentScore" | "residualScore"> = {
  title: "",
  description: "",
  asset: "",
  threat: "",
  vulnerability: "",
  likelihood: 3,
  impact: 3,
  existingControls: "",
  residualLikelihood: 2,
  residualImpact: 2,
  owner: "",
  treatment: "mitigate",
  treatmentPlan: "",
  targetDate: "",
  status: "open",
  linkedControls: [],
  linkedClauseQuestions: [],
};

export default function IsoRiskAssessment() {
  const { risks, addRisk, updateRisk, deleteRisk, metrics, treatmentActions } = useIsoRisks();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState(defaultDraft);

  const sortedRisks = useMemo(
    () => [...risks].sort((a, b) => b.residualScore - a.residualScore),
    [risks],
  );

  const residualChart = useMemo(
    () =>
      (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const)
        .map((lvl) => ({
          name: lvl.charAt(0) + lvl.slice(1).toLowerCase(),
          value: metrics.byResidualLevel[lvl],
        }))
        .filter((d) => d.value > 0),
    [metrics.byResidualLevel],
  );

  const statusChart = useMemo(() => {
    const m: Record<string, number> = {};
    risks.forEach((r) => {
      const k = r.status.replace("-", " ");
      m[k] = (m[k] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [risks]);

  const treatmentChart = useMemo(() => {
    const m: Record<string, number> = {};
    treatmentActions.forEach((a) => {
      m[a.status] = (m[a.status] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [treatmentActions]);

  const priorityRisks = sortedRisks.slice(0, 4);

  const allControls = useMemo(() => ANNEX_A.flatMap((g) => g.controls), []);

  const startCreate = () => {
    setEditing(null);
    setDraft({ ...defaultDraft });
    setOpen(true);
  };
  const startEdit = (r: RiskEntry) => {
    setEditing(r.id);
    setDraft({
      title: r.title,
      description: r.description ?? "",
      asset: r.asset ?? "",
      threat: r.threat ?? "",
      vulnerability: r.vulnerability ?? "",
      likelihood: r.likelihood,
      impact: r.impact,
      existingControls: r.existingControls ?? "",
      residualLikelihood: r.residualLikelihood,
      residualImpact: r.residualImpact,
      owner: r.owner ?? "",
      treatment: r.treatment,
      treatmentPlan: r.treatmentPlan ?? "",
      targetDate: r.targetDate ?? "",
      status: r.status,
      linkedControls: r.linkedControls,
      linkedClauseQuestions: r.linkedClauseQuestions,
    });
    setOpen(true);
  };

  const save = () => {
    if (!draft.title) return;
    if (editing) updateRisk(editing, draft);
    else addRisk(draft);
    setOpen(false);
  };

  return (
    <IsoPage
      title="Risk assessment"
      description="Information security risk register supporting ISO/IEC 27001 risk assessment and treatment: inherent vs residual scoring, Annex A mapping, and treatment actions (align methodology and acceptance criteria with your ISMS policy)."
      actions={
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add risk
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        <MetricCard label="Total risks" value={metrics.total} />
        <MetricCard label="Open / active" value={metrics.open} tone={metrics.open > 0 ? "warning" : "success"} />
        <MetricCard label="Critical" value={metrics.byResidualLevel.CRITICAL} tone={metrics.byResidualLevel.CRITICAL > 0 ? "danger" : "success"} />
        <MetricCard label="High" value={metrics.byResidualLevel.HIGH} tone={metrics.byResidualLevel.HIGH > 0 ? "danger" : "success"} />
        <MetricCard label="Medium" value={metrics.byResidualLevel.MEDIUM} tone="warning" />
        <MetricCard label="Treatment actions" value={treatmentActions.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartPanel title="Residual severity distribution" subtitle="Based on residual score bands in the register">
          {residualChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No risks to chart</div>
          ) : (
            <DonutDistributionChart data={residualChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Risk lifecycle status" subtitle="Workflow state across the register">
          {statusChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No risks to chart</div>
          ) : (
            <HorizontalBarChart data={statusChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Treatment action status" subtitle="Actions linked to mitigation work">
          {treatmentChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No actions yet</div>
          ) : (
            <HorizontalBarChart data={treatmentChart} />
          )}
        </ChartPanel>
      </div>

      {priorityRisks.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <SectionHeading
              title="Priority attention"
              subtitle="Highest residual scores — confirm treatment owners and Annex A coverage."
              right={<Shield className="h-5 w-5 text-primary" />}
            />
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {priorityRisks.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => startEdit(r)}
                className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm line-clamp-1">{r.title}</span>
                  <StatusPill label={scoreToLevel(r.residualScore)} tone={LEVEL_TONE[scoreToLevel(r.residualScore)]} />
                </div>
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <div>
                    Inherent {r.inherentScore} → Residual {r.residualScore}
                  </div>
                  <div>
                    Controls: {r.linkedControls.length ? r.linkedControls.slice(0, 3).join(", ") : "—"}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <SectionHeading title="Residual heatmap" subtitle="Likelihood × impact after controls — use with the register below." />
        </CardHeader>
        <CardContent>
          <Heatmap risks={sortedRisks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionHeading title="Risk register" subtitle="Sorted by residual score" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Asset / Threat</TableHead>
                  <TableHead>Inherent</TableHead>
                  <TableHead>Residual</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRisks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">
                      No risks yet — add your first risk to start the register.
                    </TableCell>
                  </TableRow>
                )}
                {sortedRisks.map((r) => {
                  const inherentLevel = scoreToLevel(r.inherentScore);
                  const residualLevel = scoreToLevel(r.residualScore);
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => startEdit(r)}>
                      <TableCell className="align-top">
                        <div className="text-sm font-semibold">{r.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        <div>{r.asset || "—"}</div>
                        <div>{r.threat || ""}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <StatusPill label={`${inherentLevel} · ${r.inherentScore}`} tone={LEVEL_TONE[inherentLevel]} />
                      </TableCell>
                      <TableCell className="align-top">
                        <StatusPill label={`${residualLevel} · ${r.residualScore}`} tone={LEVEL_TONE[residualLevel]} />
                      </TableCell>
                      <TableCell className="align-top text-sm capitalize">{r.treatment}</TableCell>
                      <TableCell className="align-top text-sm">{r.owner ?? "—"}</TableCell>
                      <TableCell className="align-top text-sm capitalize">{r.status.replace("-", " ")}</TableCell>
                      <TableCell className="text-right align-top">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this risk?")) deleteRisk(r.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit risk" : "Add risk"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label className="text-xs">Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Asset / process</Label>
              <Input value={draft.asset} onChange={(e) => setDraft({ ...draft, asset: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Threat</Label>
              <Input value={draft.threat} onChange={(e) => setDraft({ ...draft, threat: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Vulnerability</Label>
              <Input value={draft.vulnerability} onChange={(e) => setDraft({ ...draft, vulnerability: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Inherent likelihood (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={draft.likelihood}
                onChange={(e) => setDraft({ ...draft, likelihood: Math.min(5, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div>
              <Label className="text-xs">Inherent impact (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={draft.impact}
                onChange={(e) => setDraft({ ...draft, impact: Math.min(5, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div>
              <Label className="text-xs">Residual likelihood (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={draft.residualLikelihood}
                onChange={(e) => setDraft({ ...draft, residualLikelihood: Math.min(5, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div>
              <Label className="text-xs">Residual impact (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={draft.residualImpact}
                onChange={(e) => setDraft({ ...draft, residualImpact: Math.min(5, Math.max(1, Number(e.target.value))) })}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Existing controls</Label>
              <Textarea rows={2} value={draft.existingControls} onChange={(e) => setDraft({ ...draft, existingControls: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Treatment</Label>
              <Select value={draft.treatment} onValueChange={(v: any) => setDraft({ ...draft, treatment: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mitigate">Mitigate</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="avoid">Avoid</SelectItem>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="none">None yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Owner</Label>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Target date</Label>
              <Input type="date" value={draft.targetDate} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={draft.status} onValueChange={(v: any) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="treated">Treated</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Mapped Annex A controls</Label>
              <div className="max-h-36 overflow-auto rounded-md border border-border p-2 flex flex-wrap gap-1">
                {allControls.map((c) => {
                  const selected = draft.linkedControls.includes(c.reference);
                  return (
                    <button
                      key={c.reference}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          linkedControls: selected
                            ? prev.linkedControls.filter((r) => r !== c.reference)
                            : [...prev.linkedControls, c.reference],
                        }))
                      }
                      className={
                        "rounded-full border px-2 py-0.5 text-[11px] " +
                        (selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground")
                      }
                    >
                      {c.reference}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs">Treatment plan</Label>
              <Textarea rows={3} value={draft.treatmentPlan} onChange={(e) => setDraft({ ...draft, treatmentPlan: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create risk"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IsoPage>
  );
}

function Heatmap({ risks }: { risks: RiskEntry[] }) {
  const grid: Record<string, number> = {};
  risks.forEach((r) => {
    const k = `${r.residualLikelihood}-${r.residualImpact}`;
    grid[k] = (grid[k] ?? 0) + 1;
  });
  const cellColor = (l: number, i: number) => {
    const score = l * i;
    if (score >= 20) return "bg-rose-600 text-white";
    if (score >= 12) return "bg-rose-400/80 text-white";
    if (score >= 6) return "bg-amber-300";
    return "bg-emerald-200";
  };
  return (
    <div className="inline-block border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[auto_repeat(5,4rem)]">
        <div />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="text-center text-[11px] font-medium text-muted-foreground py-1">Impact {i}</div>
        ))}
        {[5, 4, 3, 2, 1].map((l) => (
          <>
            <div key={`label-${l}`} className="pr-2 py-1 text-[11px] font-medium text-muted-foreground text-right">
              Likelihood {l}
            </div>
            {[1, 2, 3, 4, 5].map((i) => {
              const count = grid[`${l}-${i}`] ?? 0;
              return (
                <div
                  key={`cell-${l}-${i}`}
                  className={
                    "flex items-center justify-center h-14 border border-border/60 text-sm font-semibold " +
                    cellColor(l, i)
                  }
                >
                  {count || ""}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
