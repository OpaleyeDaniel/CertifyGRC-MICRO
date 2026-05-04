import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle2, Download, Search } from "lucide-react";
import {
  Chip,
  IsoPage,
  MetricCard,
  SectionHeading,
  StatusPill,
} from "./_shared";
import { useIsoSoA } from "@/frameworks/iso27001/hooks/useIsoSoA";
import { ANNEX_A, type Applicability, type ImplementationStatus } from "@/frameworks/iso27001/data";

const STATUS_TONE: Record<ImplementationStatus, "success" | "warning" | "danger" | "info" | "muted"> = {
  implemented: "success",
  partial: "warning",
  planned: "info",
  "not-implemented": "danger",
  "not-applicable": "muted",
};

export default function IsoSoA() {
  const { entries, setApplicability, setStatus, setEntry, approve } = useIsoSoA();
  const [query, setQuery] = useState("");
  const [applicabilityFilter, setApplicabilityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return entries.filter(({ control, entry }) => {
      if (domainFilter !== "all" && control.domain !== domainFilter) return false;
      if (applicabilityFilter !== "all" && entry.applicability !== applicabilityFilter) return false;
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !control.reference.toLowerCase().includes(q) &&
          !control.name.toLowerCase().includes(q) &&
          !control.objective.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [entries, query, applicabilityFilter, statusFilter, domainFilter]);

  const metrics = useMemo(() => {
    const total = entries.length;
    const applicable = entries.filter((e) => e.entry.applicability === "applicable").length;
    const notApplicable = entries.filter((e) => e.entry.applicability === "not-applicable").length;
    const implemented = entries.filter((e) => e.entry.status === "implemented").length;
    const approved = entries.filter((e) => e.entry.reviewStatus === "approved").length;
    return { total, applicable, notApplicable, implemented, approved };
  }, [entries]);

  const exportCsv = () => {
    const headers = [
      "Control",
      "Name",
      "Domain",
      "Applicability",
      "Justification",
      "Status",
      "Owner",
      "Review status",
      "Approved by",
      "Approved at",
    ];
    const rows = entries.map((e) => [
      e.control.reference,
      e.control.name,
      e.group.name,
      e.entry.applicability,
      (e.entry.justification ?? "").replace(/\n/g, " "),
      e.entry.status,
      e.entry.owner ?? "",
      e.entry.reviewStatus,
      e.entry.approvedBy ?? "",
      e.entry.approvedAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iso27001-soa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <IsoPage
      title="Statement of Applicability"
      description="Every Annex A control with applicability, justification, implementation status, ownership, and approval. Filter, review and export."
      actions={
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <MetricCard label="Total controls" value={metrics.total} />
        <MetricCard label="Applicable" value={metrics.applicable} tone="success" />
        <MetricCard label="Excluded" value={metrics.notApplicable} />
        <MetricCard label="Implemented" value={metrics.implemented} tone={metrics.implemented > 0 ? "success" : undefined} />
        <MetricCard label="SoA approved" value={metrics.approved} />
      </div>

      <Card>
        <CardHeader>
          <SectionHeading title="Controls" subtitle="Click a row to edit applicability, status, owner and justification." />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search controls…"
                className="pl-8"
              />
            </div>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {ANNEX_A.map((g) => (
                  <SelectItem key={g.domain} value={g.domain}>
                    {g.domain} · {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={applicabilityFilter} onValueChange={setApplicabilityFilter}>
              <SelectTrigger><SelectValue placeholder="Applicability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All applicability</SelectItem>
                <SelectItem value="applicable">Applicable</SelectItem>
                <SelectItem value="not-applicable">Not applicable</SelectItem>
                <SelectItem value="under-review">Under review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="not-implemented">Not implemented</SelectItem>
                <SelectItem value="not-applicable">Not applicable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Ref</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead>Applicability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ control, group, entry, score }) => (
                  <SoARow
                    key={control.reference}
                    controlRef={control.reference}
                    name={control.name}
                    domain={group.name}
                    objective={control.objective}
                    applicability={entry.applicability}
                    justification={entry.justification}
                    status={entry.status}
                    owner={entry.owner}
                    reviewStatus={entry.reviewStatus}
                    approvedBy={entry.approvedBy}
                    percent={score.percent}
                    onApplicability={(a) => setApplicability(control.reference, a)}
                    onJustification={(j) => setEntry(control.reference, { justification: j })}
                    onStatus={(s) => setStatus(control.reference, s)}
                    onOwner={(o) => setEntry(control.reference, { owner: o })}
                    onReview={(r) => setEntry(control.reference, { reviewStatus: r as any })}
                    onApprove={() => approve(control.reference, "ISMS Manager")}
                  />
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      No controls match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </IsoPage>
  );
}

function SoARow({
  controlRef,
  name,
  domain,
  objective,
  applicability,
  justification,
  status,
  owner,
  reviewStatus,
  approvedBy,
  percent,
  onApplicability,
  onJustification,
  onStatus,
  onOwner,
  onReview,
  onApprove,
}: {
  controlRef: string;
  name: string;
  domain: string;
  objective: string;
  applicability: Applicability;
  justification?: string;
  status: ImplementationStatus;
  owner?: string;
  reviewStatus: string;
  approvedBy?: string;
  percent: number;
  onApplicability: (a: Applicability) => void;
  onJustification: (j: string) => void;
  onStatus: (s: ImplementationStatus) => void;
  onOwner: (o: string) => void;
  onReview: (r: string) => void;
  onApprove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <TableCell className="font-mono text-xs align-top">{controlRef}</TableCell>
        <TableCell className="align-top">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{domain} · {percent}% readiness</div>
        </TableCell>
        <TableCell className="align-top">
          <Chip label={applicability} tone={applicability === "applicable" ? "info" : "muted"} />
        </TableCell>
        <TableCell className="align-top">
          <StatusPill label={status.replace("-", " ")} tone={STATUS_TONE[status]} />
        </TableCell>
        <TableCell className="align-top text-sm">{owner ?? "—"}</TableCell>
        <TableCell className="align-top">
          <Chip label={reviewStatus} tone={reviewStatus === "approved" ? "info" : "muted"} />
        </TableCell>
        <TableCell className="text-right align-top">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
            {open ? "Collapse" : "Edit"}
          </Button>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-2">{objective}</div>
                <Label className="text-xs">Applicability</Label>
                <Select value={applicability} onValueChange={(v) => onApplicability(v as Applicability)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applicable">Applicable</SelectItem>
                    <SelectItem value="not-applicable">Not applicable</SelectItem>
                    <SelectItem value="under-review">Under review</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-xs mt-3">Justification</Label>
                <Textarea
                  rows={3}
                  value={justification ?? ""}
                  placeholder={
                    applicability === "not-applicable"
                      ? "Why is this control not applicable? Required for audit."
                      : "Optional context for this control's applicability"
                  }
                  onChange={(e) => onJustification(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Implementation status</Label>
                <Select value={status} onValueChange={(v) => onStatus(v as ImplementationStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="implemented">Implemented</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="not-implemented">Not implemented</SelectItem>
                    <SelectItem value="not-applicable">Not applicable</SelectItem>
                  </SelectContent>
                </Select>
                <Label className="text-xs mt-3">Owner</Label>
                <Input value={owner ?? ""} onChange={(e) => onOwner(e.target.value)} placeholder="Owner name / role" />
                <Label className="text-xs mt-3">Review status</Label>
                <Select value={reviewStatus} onValueChange={onReview}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["draft", "submitted", "under-review", "changes-requested", "approved", "rejected", "closed"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={onApprove}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  {approvedBy && (
                    <Badge variant="outline">Approved by {approvedBy}</Badge>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
