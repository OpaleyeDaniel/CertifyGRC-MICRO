import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { MessageSquare, Filter } from "lucide-react";
import { IsoPage, MetricCard, SectionHeading, StatusPill, EmptyState } from "./_shared";
import { useIsoGovernance } from "@/frameworks/iso27001/hooks/useIsoGovernance";
import type { Comment } from "@/frameworks/iso27001/hooks/useIsoStore";
import { formatRelative } from "./_shared";
import { useIsoStore } from "@/frameworks/iso27001/hooks/useIsoStore";
import { ChartPanel, DonutDistributionChart } from "./workspace/IsoRecharts";

const BASE = "/frameworks/iso27001";

export default function IsoCommentsReview() {
  const { comments, addComment, resolveComment } = useIsoGovernance();
  const { state } = useIsoStore();
  const [scope, setScope] = useState<Comment["scope"]>("workspace");
  const [targetId, setTargetId] = useState("workspace");
  const [author, setAuthor] = useState("Reviewer");
  const [text, setText] = useState("");
  const [scopeTab, setScopeTab] = useState<string>("all");

  const pendingReviews = comments.filter((c) => !c.resolved).length;
  const resolved = comments.filter((c) => c.resolved).length;

  const scopeChart = useMemo(() => {
    const m: Record<string, number> = {};
    comments.forEach((c) => {
      m[c.scope] = (m[c.scope] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [comments]);

  const reviewStateChart = useMemo(
    () => [
      { name: "Open", value: pendingReviews },
      { name: "Resolved", value: resolved },
    ],
    [pendingReviews, resolved],
  );

  const questionReviewSummary = useMemo(() => {
    let submitted = 0;
    let underReview = 0;
    let approved = 0;
    for (const qs of Object.values(state.questions)) {
      if (qs.reviewStatus === "submitted") submitted++;
      else if (qs.reviewStatus === "under-review") underReview++;
      else if (qs.reviewStatus === "approved") approved++;
    }
    return { submitted, underReview, approved };
  }, [state.questions]);

  const workflowChart = useMemo(
    () =>
      [
        { name: "Submitted", value: questionReviewSummary.submitted },
        { name: "Under review", value: questionReviewSummary.underReview },
        { name: "Approved", value: questionReviewSummary.approved },
      ].filter((d) => d.value > 0),
    [questionReviewSummary],
  );

  const filteredThread = useMemo(() => {
    const list = [...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (scopeTab === "all") return list;
    if (scopeTab === "open") return list.filter((c) => !c.resolved);
    return list.filter((c) => c.scope === scopeTab);
  }, [comments, scopeTab]);

  const submit = () => {
    if (!text.trim()) return;
    addComment({ scope, targetId, author, text });
    setText("");
  };

  return (
    <IsoPage
      title="Comment &amp; review"
      description="Collaborative review threads across the ISO workspace, plus visibility into assessment question review states (draft → submitted → approved). Use this alongside formal internal audit and management review records."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total comments" value={comments.length} />
        <MetricCard label="Open" value={pendingReviews} tone={pendingReviews ? "warning" : "success"} />
        <MetricCard label="Resolved" value={resolved} tone="success" />
        <MetricCard
          label="Qs awaiting approval"
          value={questionReviewSummary.submitted + questionReviewSummary.underReview}
          tone={questionReviewSummary.submitted + questionReviewSummary.underReview > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Comments by scope" subtitle="Where discussion is anchored">
          {scopeChart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No comments yet</div>
          ) : (
            <DonutDistributionChart data={scopeChart} />
          )}
        </ChartPanel>
        <ChartPanel title="Comment resolution" subtitle="Open vs resolved threads">
          <DonutDistributionChart data={reviewStateChart} />
        </ChartPanel>
      </div>

      {workflowChart.length > 0 && (
        <ChartPanel
          title="Assessment review pipeline"
          subtitle="Question-level statuses in the register (not a substitute for audit sign-off)."
        >
          <DonutDistributionChart data={workflowChart} />
        </ChartPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionHeading title="Add comment" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Scope</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as Comment["scope"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workspace">Workspace</SelectItem>
                    <SelectItem value="clause">Clause</SelectItem>
                    <SelectItem value="control">Control</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="evidence">Evidence</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target id</Label>
                <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="e.g. c4-1 or A.5.15" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Author</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Comment</Label>
              <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <Button onClick={submit}>
              <MessageSquare className="h-4 w-4 mr-1" /> Post
            </Button>
            <p className="text-xs text-muted-foreground">
              Set per-question review status in Assessment for formal workflow; use threads here for collaboration.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${BASE}/assessment`}>Go to assessment</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionHeading
              title="Threads"
              right={
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  <Select value={scopeTab} onValueChange={setScopeTab}>
                    <SelectTrigger className="w-44 h-9">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All comments</SelectItem>
                      <SelectItem value="open">Open only</SelectItem>
                      <SelectItem value="workspace">Workspace</SelectItem>
                      <SelectItem value="clause">Clause</SelectItem>
                      <SelectItem value="control">Control</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="evidence">Evidence</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </CardHeader>
          <CardContent className="max-h-[480px] overflow-y-auto space-y-3">
            {filteredThread.length === 0 ? (
              <EmptyState title="No threads" description="Post a comment or change filters." />
            ) : (
              filteredThread.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-3 space-y-2 bg-card/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {c.scope} · {c.targetId}
                    </span>
                    <StatusPill label={c.resolved ? "Resolved" : "Open"} tone={c.resolved ? "success" : "warning"} />
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>{c.author}</span>
                    <span>{formatRelative(c.createdAt)}</span>
                  </div>
                  {!c.resolved && (
                    <Button size="sm" variant="outline" onClick={() => resolveComment(c.id)}>
                      Resolve
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </IsoPage>
  );
}
