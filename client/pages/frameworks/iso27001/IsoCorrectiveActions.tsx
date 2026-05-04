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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading, StatusPill } from "./_shared";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import type { Finding } from "@/frameworks/iso27001/hooks/useIsoStore";

export default function IsoCorrectiveActions() {
  const { findings, updateFinding, addFinding } = useIsoGovernance();
  const [filter, setFilter] = useState<string>("open");
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    severity: "minor" as Finding["severity"],
    owner: "",
    rootCause: "",
    correctiveAction: "",
    targetDate: "",
  });

  const rows = useMemo(() => {
    return findings.filter((f) => {
      if (filter === "open") return f.status !== "closed" && f.status !== "verified";
      if (filter === "all") return true;
      return f.status === filter;
    });
  }, [findings, filter]);

  const save = () => {
    if (!draft.title.trim()) return;
    addFinding({
      source: "self-identified",
      title: draft.title,
      description: draft.description,
      severity: draft.severity,
      owner: draft.owner,
      rootCause: draft.rootCause,
      correctiveAction: draft.correctiveAction,
      targetDate: draft.targetDate,
      status: "open",
    });
    setDraft({
      title: "",
      description: "",
      severity: "minor",
      owner: "",
      rootCause: "",
      correctiveAction: "",
      targetDate: "",
    });
  };

  return (
    <IsoPage
      title="Corrective actions (CAPA)"
      description="Nonconformities, root cause, corrective and preventive actions, effectiveness verification — clause 10.2."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Open" value={findings.filter((f) => f.status === "open").length} />
        <MetricCard label="In progress" value={findings.filter((f) => f.status === "in-progress").length} />
        <MetricCard label="Verified" value={findings.filter((f) => f.status === "verified").length} />
        <MetricCard label="Closed" value={findings.filter((f) => f.status === "closed").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <SectionHeading title="New finding / CAPA" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea rows={2} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Severity</Label>
                <Select
                  value={draft.severity}
                  onValueChange={(v) => setDraft((d) => ({ ...d, severity: v as Finding["severity"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["critical", "major", "minor", "observation", "opportunity"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target date</Label>
                <Input type="date" value={draft.targetDate} onChange={(e) => setDraft((d) => ({ ...d, targetDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Owner</Label>
              <Input value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Root cause</Label>
              <Textarea rows={2} value={draft.rootCause} onChange={(e) => setDraft((d) => ({ ...d, rootCause: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Corrective action</Label>
              <Textarea rows={2} value={draft.correctiveAction} onChange={(e) => setDraft((d) => ({ ...d, correctiveAction: e.target.value }))} />
            </div>
            <Button onClick={save}>
              <RefreshCw className="h-4 w-4 mr-1" /> Add to register
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <SectionHeading
              title="Register"
              right={
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open items</SelectItem>
                    <SelectItem value="in-progress">In progress</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{f.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{f.correctiveAction || f.description}</div>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={f.severity}
                        tone={f.severity === "critical" ? "danger" : f.severity === "major" ? "warning" : "muted"}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={f.status}
                        onValueChange={(v) => updateFinding(f.id, { status: v as Finding["status"] })}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["open", "in-progress", "verified", "closed"] as const).map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{f.owner ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
