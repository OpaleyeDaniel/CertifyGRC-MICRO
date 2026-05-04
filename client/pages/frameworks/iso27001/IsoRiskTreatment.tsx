import { Fragment, useMemo, useState } from "react";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading } from "./_shared";
import { useIsoRisks } from "@/frameworks/iso27001/hooks/useIsoRisks";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import type { TreatmentAction } from "@/frameworks/iso27001/hooks/useIsoStore";

export default function IsoRiskTreatment() {
  const { risks, treatmentActions, addTreatmentAction, updateTreatmentAction, deleteTreatmentAction } =
    useIsoRisks();
  const { addFinding } = useIsoGovernance();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<TreatmentAction>>({
    title: "",
    description: "",
    owner: "",
    targetDate: "",
    status: "pending",
    linkedControls: [],
    riskId: "",
  });

  const byRisk = useMemo(() => {
    const m = new Map<string, TreatmentAction[]>();
    treatmentActions.forEach((a) => {
      const list = m.get(a.riskId) ?? [];
      list.push(a);
      m.set(a.riskId, list);
    });
    return m;
  }, [treatmentActions]);

  const openActions = treatmentActions.filter((a) => a.status !== "done").length;

  const createFromRisk = (riskId: string) => {
    setDraft({
      riskId,
      title: "",
      description: "",
      owner: "",
      targetDate: "",
      status: "pending",
      linkedControls: risks.find((r) => r.id === riskId)?.linkedControls ?? [],
    });
    setOpen(true);
  };

  const saveAction = () => {
    if (!draft.riskId || !draft.title?.trim()) return;
    addTreatmentAction({
      riskId: draft.riskId,
      title: draft.title.trim(),
      description: draft.description,
      owner: draft.owner,
      targetDate: draft.targetDate,
      status: (draft.status as TreatmentAction["status"]) ?? "pending",
      linkedControls: draft.linkedControls ?? [],
    });
    setOpen(false);
  };

  const promoteToCapa = (a: TreatmentAction) => {
    addFinding({
      source: "self-identified",
      title: `Treatment action — ${a.title}`,
      description: a.description,
      severity: "minor",
      owner: a.owner,
      status: "open",
    });
  };

  return (
    <IsoPage
      title="Risk treatment plan"
      description="Map treatment decisions to Annex A controls, track actions, residual risk updates, and hand off to corrective action when needed."
      actions={
        <Fragment>
          <Button
            onClick={() => {
              setDraft({
                riskId: risks[0]?.id ?? "",
                title: "",
                description: "",
                owner: "",
                targetDate: "",
                status: "pending",
                linkedControls: [],
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> New treatment action
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Treatment action</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs">Risk</Label>
                <Select
                  value={draft.riskId}
                  onValueChange={(v) => setDraft((d) => ({ ...d, riskId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk" />
                  </SelectTrigger>
                  <SelectContent>
                    {risks.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Action title</Label>
                <Input
                  value={draft.title ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Owner</Label>
                  <Input
                    value={draft.owner ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Target date</Label>
                  <Input
                    type="date"
                    value={draft.targetDate ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft((d) => ({ ...d, status: v as TreatmentAction["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["pending", "in-progress", "done", "blocked"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAction}>Save</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </Fragment>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Open risks" value={risks.filter((r) => r.status === "open" || r.status === "in-progress").length} />
        <MetricCard label="Treatment actions" value={treatmentActions.length} />
        <MetricCard label="In flight" value={openActions} tone={openActions ? "warning" : "success"} />
        <MetricCard label="Risks in register" value={risks.length} />
      </div>

      <Card>
        <CardHeader>
          <SectionHeading
            title="Actions by risk"
            subtitle="Complete actions, update residual likelihood/impact on the risk record, then verify effectiveness."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add risks under Risk assessment first.</p>
          ) : (
            risks.map((risk) => (
              <div key={risk.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{risk.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Residual {risk.residualLikelihood}×{risk.residualImpact} = {risk.residualScore} · Treatment:{" "}
                      {risk.treatment}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => createFromRisk(risk.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add action
                  </Button>
                </div>
                {(byRisk.get(risk.id) ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No treatment actions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(byRisk.get(risk.id) ?? []).map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{a.title}</div>
                            {a.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{a.owner ?? "—"}</TableCell>
                          <TableCell className="text-sm">{a.targetDate ?? "—"}</TableCell>
                          <TableCell>
                            <Select
                              value={a.status}
                              onValueChange={(v) =>
                                updateTreatmentAction(a.id, { status: v as TreatmentAction["status"] })
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(["pending", "in-progress", "done", "blocked"] as const).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => promoteToCapa(a)}>
                              CAPA
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteTreatmentAction(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </IsoPage>
  );
}
