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
import { Users } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading, StatusPill } from "./_shared";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import type { ManagementReview } from "@/frameworks/iso27001/hooks/useIsoStore";

export default function IsoManagementReview() {
  const { reviews, addReview, updateReview } = useIsoGovernance();
  const [participantsText, setParticipantsText] = useState("");
  const [draft, setDraft] = useState({
    date: "",
    inputs: {
      previousActionsStatus: "",
      contextChanges: "",
      performanceTrends: "",
      incidents: "",
      risks: "",
      improvementOpportunities: "",
      stakeholderFeedback: "",
    },
    outputs: {
      decisions: "",
      actions: "",
      resourceNeeds: "",
    },
    approvedBy: "",
    status: "draft" as ManagementReview["status"],
  });

  const save = () => {
    if (!draft.date) return;
    addReview({
      date: draft.date,
      participants: participantsText.split(",").map((s) => s.trim()).filter(Boolean),
      inputs: draft.inputs,
      outputs: draft.outputs,
      approvedBy: draft.approvedBy,
      status: draft.status,
    });
    setParticipantsText("");
    setDraft({
      date: "",
      inputs: {
        previousActionsStatus: "",
        contextChanges: "",
        performanceTrends: "",
        incidents: "",
        risks: "",
        improvementOpportunities: "",
        stakeholderFeedback: "",
      },
      outputs: { decisions: "", actions: "", resourceNeeds: "" },
      approvedBy: "",
      status: "draft",
    });
  };

  return (
    <IsoPage
      title="Management review"
      description="Structured inputs and outputs for ISO 27001 clause 9.3 — performance, risks, incidents, improvement and management decisions."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Reviews recorded" value={reviews.length} />
        <MetricCard
          label="Approved"
          value={reviews.filter((r) => r.status === "approved").length}
          tone="success"
        />
        <MetricCard label="Draft" value={reviews.filter((r) => r.status === "draft").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading
              title="Record a management review"
              subtitle="Use this pack as the single narrative for certification and surveillance audits."
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Review date</Label>
                <Input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft((d) => ({ ...d, status: v as ManagementReview["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Participants (comma-separated)</Label>
              <Input
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
                placeholder="CEO, CISO, Head of Operations"
              />
            </div>
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inputs</div>
              {(Object.keys(draft.inputs) as (keyof typeof draft.inputs)[]).map((key) => (
                <div key={key}>
                  <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  <Textarea
                    rows={2}
                    value={draft.inputs[key]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, inputs: { ...d.inputs, [key]: e.target.value } }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outputs</div>
              {(Object.keys(draft.outputs) as (keyof typeof draft.outputs)[]).map((key) => (
                <div key={key}>
                  <Label className="text-xs capitalize">{key}</Label>
                  <Textarea
                    rows={2}
                    value={draft.outputs[key]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, outputs: { ...d.outputs, [key]: e.target.value } }))
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Approved by</Label>
              <Input
                value={draft.approvedBy}
                onChange={(e) => setDraft((d) => ({ ...d, approvedBy: e.target.value }))}
              />
            </div>
            <Button onClick={save}>
              <Users className="h-4 w-4 mr-1" /> Save review
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading title="History" />
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              [...reviews]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{r.date}</span>
                      <div className="flex items-center gap-2">
                        <StatusPill label={r.status} tone={r.status === "approved" ? "success" : "muted"} />
                        <Select
                          value={r.status}
                          onValueChange={(v) => updateReview(r.id, { status: v as ManagementReview["status"] })}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Participants: {r.participants.join(", ") || "—"}
                    </p>
                    <p className="text-xs line-clamp-3">{r.outputs.decisions || r.inputs.risks || "—"}</p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
