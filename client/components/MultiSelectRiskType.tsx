import { Badge } from "@/components/ui/badge";

interface MultiSelectRiskTypeProps {
  selectedRiskTypes: ("C" | "I" | "A")[];
  onChange: (types: ("C" | "I" | "A")[]) => void;
}

const RISK_TYPES = [
  { value: "C" as const, label: "Confidentiality", description: "Unauthorized access or disclosure of information" },
  { value: "I" as const, label: "Integrity", description: "Unauthorized modification of information" },
  { value: "A" as const, label: "Availability", description: "Disruption of service or access to information" },
];

export function MultiSelectRiskType({ selectedRiskTypes, onChange }: MultiSelectRiskTypeProps) {
  const toggleRiskType = (type: "C" | "I" | "A") => {
    if (selectedRiskTypes.includes(type)) {
      onChange(selectedRiskTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedRiskTypes, type]);
    }
  };

  const getRiskTypeColor = (type: "C" | "I" | "A") => {
    switch (type) {
      case "C":
        return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
      case "I":
        return "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200";
      case "A":
        return "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200";
    }
  };

  const getRiskTypeBadgeColor = (type: "C" | "I" | "A") => {
    switch (type) {
      case "C":
        return "bg-blue-100 text-blue-800";
      case "I":
        return "bg-purple-100 text-purple-800";
      case "A":
        return "bg-orange-100 text-orange-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Checkbox Options */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {RISK_TYPES.map((riskType) => (
          <label
            key={riskType.value}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${getRiskTypeColor(riskType.value)}`}
          >
            <input
              type="checkbox"
              checked={selectedRiskTypes.includes(riskType.value)}
              onChange={() => toggleRiskType(riskType.value)}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {riskType.value} - {riskType.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{riskType.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Selected Risk Types Display */}
      {selectedRiskTypes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Selected Risk Types:</p>
          <div className="flex flex-wrap gap-2">
            {selectedRiskTypes.map((type) => (
              <Badge
                key={type}
                className={`px-3 py-1 text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getRiskTypeBadgeColor(type)}`}
                onClick={() => toggleRiskType(type)}
                title="Click to remove"
              >
                {type === "C"
                  ? "Confidentiality"
                  : type === "I"
                  ? "Integrity"
                  : "Availability"}
                <span className="ml-2">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {selectedRiskTypes.length === 0 && (
        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
          Please select at least one risk type (Confidentiality, Integrity, or Availability)
        </p>
      )}
    </div>
  );
}
