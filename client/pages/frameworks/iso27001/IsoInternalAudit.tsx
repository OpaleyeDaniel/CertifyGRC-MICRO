import { useState } from "react";
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
import { ClipboardCheck, Plus } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading } from "./_shared";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import type { InternalAudit } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ISO_CLAUSES, getAnnexControls } from "@/frameworks/iso27001/data";

const annexRefs = getAnnexControls().map((c) => c.reference);
const clauseRefs = ISO_CLAUSES.map((c) => `Clause ${c.number}`);

export default function IsoInternalAudit() {
  const { audits, addAudit, updateAudit, findings } = useIsoGovernance();
  const [draft, setDraft] = useState({
    title: "",
    scope: "",
    criteria: "ISO/IEC 27001:2022",
    auditor: "",
    independence: "",
    plannedDate: "",
    status: "planned" as InternalAudit["status"],
    checklist: [] as string[],
    reportNotes: "",
  });

  const savePlan = () => {
    if (!draft.title.trim() || !draft.plannedDate) return;
    addAudit({
      title: draft.title,
      scope: draft.scope,
      criteria: draft.criteria,
      auditor: draft.auditor,
      independence: draft.independence,
      plannedDate: draft.plannedDate,
      status: draft.status,
      checklist: draft.checklist,
      findings: [],
      reportNotes: draft.reportNotes,
    });
    setDraft({
      title: "",
      scope: "",
      criteria: "ISO/IEC 27001:2022",
      auditor: "",
      independence: "",
      plannedDate: "",
      status: "planned",
      checklist: [],
      reportNotes: "",
    });
  };

  const toggleChecklist = (ref: string) => {
    setDraft((d) => ({
      ...d,
      checklist: d.checklist.includes(ref) ? d.checklist.filter((x) => x !== ref) : [...d.checklist, ref],
    }));
  };

  return (
    <IsoPage
      title="Internal audit"
      description="Plan scope, criteria, independence, clause/control checklist, findings and audit report outputs per clause 9.2."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Audits" value={audits.length} />
        <MetricCard
          label="Active"
          value={audits.filter((a) => a.status === "planned" || a.status === "in-progress").length}
        />
        <MetricCard label="Open findings" value={findings.filter((f) => f.source === "internal-audit" && f.status !== "closed").length} />
        <MetricCard label="Reported" value={audits.filter((a) => a.status === "reported" || a.status === "closed").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading title="New / update audit plan" subtitle="Capture the minimum ISO 27001 expects for an internal audit programme." />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Scope</Label>
              <Textarea rows={2} value={draft.scope} onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Auditor</Label>
                <Input value={draft.auditor} onChange={(e) => setDraft((d) => ({ ...d, auditor: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Planned date</Label>
                <Input
                  type="date"
                  value={draft.plannedDate}
                  onChange={(e) => setDraft((d) => ({ ...d, plannedDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Independence statement</Label>
              <Textarea
                rows={2}
                value={draft.independence}
                onChange={(e) => setDraft((d) => ({ ...d, independence: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Sample checklist (select clauses / controls)</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 space-y-1 text-xs">
                {clauseRefs.map((ref) => (
                  <label key={ref} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.checklist.includes(ref)}
                      onChange={() => toggleChecklist(ref)}
                    />
                    {ref}
                  </label>
                ))}
                {annexRefs.slice(0, 24).map((ref) => (
                  <label key={ref} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.checklist.includes(ref)}
                      onChange={() => toggleChecklist(ref)}
                    />
                    {ref}
                  </label>
                ))}
                <p className="text-muted-foreground pt-1">… full Annex A available in Assessment module</p>
              </div>
            </div>
            <Button onClick={savePlan}>
              <Plus className="h-4 w-4 mr-1" /> Add audit to programme
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="Audit programme" subtitle="Track status and record report notes." />
          </CardHeader>
          <CardContent className="space-y-4">
            {audits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audits yet.</p>
            ) : (
              audits.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        {a.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {a.plannedDate} · {a.auditor || "Auditor TBD"}
                      </div>
                    </div>
                    <Select
                      value={a.status}
                      onValueChange={(v) => updateAudit(a.id, { status: v as InternalAudit["status"] })}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["planned", "in-progress", "reported", "closed"] as const).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Audit report summary / notes"
                    rows={3}
                    value={a.reportNotes ?? ""}
                    onChange={(e) => updateAudit(a.id, { reportNotes: e.target.value })}
                  />
                  <div className="text-xs text-muted-foreground">
                    Checklist items: {a.checklist.length} · Findings linked: {a.findings.length}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
