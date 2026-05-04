import type { QuestionWithState } from "@/frameworks/iso27001/hooks/useIsoAssessment";
import type { QuestionState } from "@/frameworks/iso27001/hooks/useIsoStore";

const REVIEW_KEYS = [
  "draft",
  "submitted",
  "under-review",
  "changes-requested",
  "approved",
  "rejected",
  "closed",
] as const;

export function reviewStatusDistribution(questions: Record<string, QuestionState>) {
  const map: Record<string, number> = {};
  for (const k of REVIEW_KEYS) map[k] = 0;
  let unset = 0;
  for (const qs of Object.values(questions)) {
    const s = qs.reviewStatus;
    if (!s || !(s in map)) unset++;
    else map[s] = (map[s] ?? 0) + 1;
  }
  const rows = Object.entries(map)
    .filter(([, n]) => n > 0)
    .map(([name, value]) => ({
      name: name.replace(/-/g, " "),
      value,
    }));
  if (unset > 0) rows.push({ name: "Not set", value: unset });
  return rows;
}

export function questionsMissingEvidence(applicable: QuestionWithState[]) {
  return applicable.filter((q) => {
    if (!q.state.answer) return false;
    if (!(q.evidenceRequired ?? false)) return false;
    return (q.state.evidence?.length ?? 0) === 0;
  });
}

export function completionRatio(answered: number, total: number) {
  if (!total) return 0;
  return Math.round((answered / total) * 100);
}

export function isOverdueIsoDate(isoDate?: string) {
  if (!isoDate) return false;
  const t = new Date(isoDate).getTime();
  if (!Number.isFinite(t)) return false;
  return t < Date.now();
}
