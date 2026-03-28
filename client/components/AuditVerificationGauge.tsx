interface AuditVerificationGaugeProps {
  percentage: number; // 0-100
  label?: string;
}

export function AuditVerificationGauge({
  percentage,
  label = "Total Audit Verification",
}: AuditVerificationGaugeProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage
  let color = "#ef4444"; // red for < 33%
  if (percentage >= 33 && percentage < 66) {
    color = "#f59e0b"; // amber for 33-66%
  } else if (percentage >= 66) {
    color = "#10b981"; // green for >= 66%
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {/* SVG Gauge */}
      <div className="relative w-64 h-64">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 200 200"
          style={{
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
          }}
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />

          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease-out",
              transform: "rotate(0deg)",
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color }}>
            {percentage}%
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Controls Verified
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {percentage < 33
            ? "Just getting started. Keep reviewing controls."
            : percentage < 66
            ? "Good progress! More than halfway through."
            : "Excellent! Most controls are verified."}
        </p>
      </div>
    </div>
  );
}
