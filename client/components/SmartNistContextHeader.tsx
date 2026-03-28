import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface SmartNistContextHeaderProps {
  nistId: string;
  function: string;
  category: string;
}

export function SmartNistContextHeader({
  nistId,
  function: functionName,
  category,
}: SmartNistContextHeaderProps) {
  // Extract subcategory from NIST ID (e.g., "GV.OC-01" -> subcategory code)
  const subcategoryInfo = useMemo(() => {
    return {
      code: nistId,
      name: `${functionName} | ${category}`,
    };
  }, [nistId, functionName, category]);

  // Get function color based on NIST function
  const getFunctionColor = (func: string) => {
    switch (func) {
      case "GOVERN":
        return "bg-indigo-100 text-indigo-800";
      case "IDENTIFY":
        return "bg-blue-100 text-blue-800";
      case "PROTECT":
        return "bg-green-100 text-green-800";
      case "DETECT":
        return "bg-yellow-100 text-yellow-800";
      case "RESPOND":
        return "bg-orange-100 text-orange-800";
      case "RECOVER":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 pt-1">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              NIST CSF 2.0 Reference
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-mono font-bold text-base text-blue-700">{subcategoryInfo.code}</span>
              <span className="text-muted-foreground"> • {subcategoryInfo.name}</span>
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-xs font-semibold ${getFunctionColor(functionName)}`}>
              {functionName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              {nistId}
            </Badge>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-muted-foreground italic">
            Auto-populated from assessment
          </p>
        </div>
      </div>
    </Card>
  );
}
