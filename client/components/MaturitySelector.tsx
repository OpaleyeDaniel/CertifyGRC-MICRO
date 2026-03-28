import { Badge } from "@/components/ui/badge";

interface MaturitySelectorProps {
  selectedScore: number | null;
  onSelect: (score: number) => void;
}

const MATURITY_LEVELS = [
  { score: 1, label: "Initial", description: "Practice is not executed or only informally adopted" },
  { score: 2, label: "Repeatable", description: "Practice is beginning to be executed with some consistency" },
  { score: 3, label: "Defined", description: "Practice is consistently executed and documented" },
  { score: 4, label: "Managed", description: "Practice is monitored and controlled" },
  { score: 5, label: "Optimized", description: "Practice is optimized and continuously improved" },
];

const SCORE_COLORS = {
  1: "bg-destructive/10 text-destructive border-destructive/30",
  2: "bg-warning/10 text-warning border-warning/30",
  3: "bg-accent/10 text-accent border-accent/30",
  4: "bg-success/10 text-success border-success/30",
  5: "bg-success/10 text-success border-success/30",
};

export function MaturitySelector({ selectedScore, onSelect }: MaturitySelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">
        Select the maturity level that best describes your organization's capability:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MATURITY_LEVELS.map(({ score, label, description }) => (
          <button
            key={score}
            onClick={() => onSelect(score)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedScore === score
                ? `border-primary bg-primary/15 ${SCORE_COLORS[score as keyof typeof SCORE_COLORS]}`
                : `border-border hover:border-primary/50 ${SCORE_COLORS[score as keyof typeof SCORE_COLORS]}`
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-sm">[{score}] {label}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
              {selectedScore === score && (
                <Badge variant="secondary" className="flex-shrink-0">
                  Selected
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
