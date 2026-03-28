import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQuarterLabel, Quarter } from "@/lib/treatmentPlanUtils";

interface QuarterlySelectorProps {
  selectedQuarter: Quarter | "";
  onQuarterChange: (quarter: Quarter) => void;
}

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export function QuarterlySelector({
  selectedQuarter,
  onQuarterChange,
}: QuarterlySelectorProps) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="space-y-4">
      {/* Quarter Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Treatment Action Timescale</label>
        <div className="grid grid-cols-4 gap-2">
          {QUARTERS.map((quarter) => (
            <Button
              key={quarter}
              variant={selectedQuarter === quarter ? "default" : "outline"}
              onClick={() => onQuarterChange(quarter)}
              className={`w-full font-semibold transition-all ${
                selectedQuarter === quarter
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {quarter}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Quarter Display */}
      {selectedQuarter && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Selected Period:</p>
              <p className="font-semibold text-blue-900">
                {selectedQuarter} {currentYear}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getQuarterLabel(currentYear, selectedQuarter)}
              </p>
            </div>
            <Badge className="bg-blue-200 text-blue-800 text-sm px-3 py-1">
              {selectedQuarter} {currentYear}
            </Badge>
          </div>
        </div>
      )}

      {!selectedQuarter && (
        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
          Please select a Quarter to set the treatment timescale
        </p>
      )}
    </div>
  );
}
