import { useMemo, useEffect, useState } from "react";
import { calculateQuarterProgress, getQuarterDateRange, Quarter } from "@/lib/treatmentPlanUtils";

interface TimeBasedProgressBarProps {
  year: number;
  quarter: Quarter | "";
  onProgressChange?: (progress: number) => void;
}

export function TimeBasedProgressBar({
  year,
  quarter,
  onProgressChange,
}: TimeBasedProgressBarProps) {
  const [progress, setProgress] = useState(0);

  // Calculate progress whenever quarter or year changes
  const calculatedProgress = useMemo(() => {
    if (!quarter) return 0;
    return calculateQuarterProgress(year, quarter as Quarter);
  }, [year, quarter]);

  // Update progress state and notify parent
  useEffect(() => {
    setProgress(calculatedProgress);
    onProgressChange?.(calculatedProgress);
  }, [calculatedProgress, onProgressChange]);

  // Get date range for display
  const dateRange = useMemo(() => {
    if (!quarter) return null;
    return getQuarterDateRange(year, quarter as Quarter);
  }, [year, quarter]);

  if (!quarter) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-lg border border-gray-300 text-center">
        <p className="text-sm text-muted-foreground">
          Select a Quarter to activate progress tracking
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Treatment Progress</p>
        <p className="text-sm font-semibold text-blue-600">{progress}%</p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 relative">
        {/* Progress Fill */}
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300 ease-out flex items-center justify-end pr-2"
          style={{ width: `${progress}%` }}
        >
          {/* Percentage Text Inside Bar */}
          {progress > 10 && (
            <span className="text-white font-bold text-sm drop-shadow-md">{progress}%</span>
          )}
        </div>

        {/* Percentage Text Outside Bar (if progress < 10%) */}
        {progress <= 10 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2">
            <span className="text-gray-700 font-bold text-sm">{progress}%</span>
          </div>
        )}
      </div>

      {/* Date Range Info */}
      {dateRange && (
        <div className="text-xs text-muted-foreground">
          <p>
            Period: {dateRange.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {dateRange.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p>
            Progress: {Math.ceil((progress / 100) * (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} of{" "}
            {Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      )}

      {/* Completion Status */}
      <div className="pt-2">
        {progress === 100 && (
          <p className="text-xs bg-green-50 text-green-700 p-2 rounded border border-green-200">
            ✓ Treatment action completed! Residual scoring is now fully enabled.
          </p>
        )}
        {progress >= 70 && progress < 100 && (
          <p className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-200">
            ✓ Treatment action nearing completion. Residual scoring is now available.
          </p>
        )}
        {progress < 70 && (
          <p className="text-xs bg-orange-50 text-orange-700 p-2 rounded border border-orange-200">
            Treatment action in progress ({progress}%). Residual scoring will be available at 70%.
          </p>
        )}
      </div>
    </div>
  );
}
