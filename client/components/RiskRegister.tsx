import { useMemo, useState } from "react";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useContinuousImprovement } from "@/hooks/useContinuousImprovement";
import { RiskAssessment } from "@/lib/gapRiskTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, TrendingUp, Lock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskRegisterProps {
  onViewDetails?: (risk: RiskAssessment) => void;
}

export function RiskRegister({ onViewDetails: _onViewDetails }: RiskRegisterProps) {
  const { getCompletedRisks } = useRiskAssessment();
  const { getCIRecord } = useContinuousImprovement();
  const [searchTerm, setSearchTerm] = useState("");
  const [assetGroupFilter, setAssetGroupFilter] = useState("All Assets");

  const completedRisks = getCompletedRisks();

  // A risk is locked when it has an active CI record (revision in progress,
  // not yet resubmitted). Locked rows cannot be edited from the register.
  const isRevisionLocked = (risk: RiskAssessment): boolean => {
    const ci = getCIRecord(risk.questionId);
    return !!ci && ci.status !== "resubmitted";
  };

  // Asset group options
  const assetGroups = [
    "All Assets",
    "Information",
    "Business activities",
    "Software",
    "Hardware",
    "Personnel",
    "Physical site",
  ];

  const assetFiltered = useMemo(() => {
    return completedRisks.filter((risk) => {
      if (assetGroupFilter === "All Assets") return true;
      return risk.riskDescription.assetGroup === assetGroupFilter;
    });
  }, [completedRisks, assetGroupFilter]);

  const filteredRisks = useMemo(() => {
    return assetFiltered.filter((risk) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        risk.nistId.toLowerCase().includes(searchLower) ||
        risk.gapDescription.toLowerCase().includes(searchLower) ||
        risk.riskDescription.asset.toLowerCase().includes(searchLower) ||
        risk.riskDescription.threat.toLowerCase().includes(searchLower) ||
        risk.riskDescription.vulnerability.toLowerCase().includes(searchLower)
      );
    });
  }, [assetFiltered, searchTerm]);

  const metrics = useMemo(() => {
    const total = completedRisks.length;
    const highRisk = completedRisks.filter((r) => r.postTreatmentRiskLevel === "HIGH").length;
    const mediumRisk = completedRisks.filter((r) => r.postTreatmentRiskLevel === "MEDIUM").length;
    const lowRisk = completedRisks.filter((r) => r.postTreatmentRiskLevel === "LOW").length;
    const averageReduction = completedRisks.length
      ? Math.round(
          completedRisks.reduce((sum, r) => {
            const inherited = r.inherentRiskLevel === "HIGH" ? 3 : r.inherentRiskLevel === "MEDIUM" ? 2 : 1;
            const residual = r.postTreatmentRiskLevel === "HIGH" ? 3 : r.postTreatmentRiskLevel === "MEDIUM" ? 2 : 1;
            return sum + ((inherited - residual) / inherited) * 100;
          }, 0) / completedRisks.length
        )
      : 0;
    return { total, highRisk, mediumRisk, lowRisk, averageReduction };
  }, [completedRisks]);

  const handleExportCSV = () => {
    const headers = [
      "Control ID", "Gap Description", "Asset Group", "Asset",
      "Threat", "Vulnerability", "Inherent Risk", "Treatment Option", "Residual Risk",
    ];
    const rows = filteredRisks.map((risk) => [
      risk.nistId, risk.gapDescription, risk.riskDescription.assetGroup,
      risk.riskDescription.asset, risk.riskDescription.threat,
      risk.riskDescription.vulnerability,
      `${risk.inherentRiskScore} (${risk.inherentRiskLevel})`,
      risk.treatmentPlan.treatmentOption || "—",
      `${risk.postTreatmentRiskScore} (${risk.postTreatmentRiskLevel})`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-register-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const headers = [
      "Control ID", "Gap Description", "Asset Group", "Asset",
      "Threat", "Vulnerability", "Inherent Risk", "Treatment Option", "Residual Risk",
    ];
    const rows = filteredRisks.map((risk) => [
      risk.nistId, risk.gapDescription, risk.riskDescription.assetGroup,
      risk.riskDescription.asset, risk.riskDescription.threat,
      risk.riskDescription.vulnerability,
      `${risk.inherentRiskScore} (${risk.inherentRiskLevel})`,
      risk.treatmentPlan.treatmentOption || "—",
      `${risk.postTreatmentRiskScore} (${risk.postTreatmentRiskLevel})`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-register-${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (completedRisks.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-900">No Risk Assessments Yet</p>
          <p className="text-sm text-blue-700 mt-1">
            Start assessing pending risks from the Pending Assessments tab to populate the Risk Register.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">Total Risks</p>
          <p className="text-3xl font-bold mt-2">{metrics.total}</p>
          <p className="text-xs text-muted-foreground mt-2">In Risk Register</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-red-600">High Risk</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{metrics.highRisk}</p>
          <p className="text-xs text-red-600 mt-2">Require action</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-yellow-600">Medium Risk</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{metrics.mediumRisk}</p>
          <p className="text-xs text-yellow-600 mt-2">Monitor closely</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-green-600">Low Risk</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{metrics.lowRisk}</p>
          <p className="text-xs text-green-600 mt-2">Acceptable</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-blue-600">Avg. Risk Reduction</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.averageReduction}%</p>
          <p className="text-xs text-blue-600 mt-2">After treatment</p>
        </CardContent></Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by NIST ID, asset, threat, or vulnerability..."
            className="pl-10 bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap overflow-x-auto">
          {assetGroups.map((asset) => (
            <Button
              key={asset}
              variant={assetGroupFilter === asset ? "default" : "outline"}
              size="sm"
              onClick={() => setAssetGroupFilter(asset)}
            >
              {asset}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />Export CSV
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />Export Excel
          </Button>
        </div>
      </div>

      {/* Risk Register Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">NIST ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Gap Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Asset Group</th>
                  <th className="text-left py-3 px-4 font-semibold">Asset</th>
                  <th className="text-left py-3 px-4 font-semibold">Inherent Risk</th>
                  <th className="text-left py-3 px-4 font-semibold">Treatment Option</th>
                  <th className="text-left py-3 px-4 font-semibold">Post-Treatment</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk) => {
                  const locked = isRevisionLocked(risk);
                  return (
                    <tr
                      key={risk.riskId}
                      className={cn(
                        "border-b transition-colors",
                        locked
                          ? "bg-orange-50/60 cursor-not-allowed opacity-80"
                          : "hover:bg-muted/50"
                      )}
                      title={locked ? "Locked — revision in progress." : "Read-only risk register row"}
                    >
                      <td className="py-4 px-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {risk.nistId}
                        </code>
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <p className="text-sm truncate">{risk.gapDescription}</p>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="text-xs">
                          {risk.riskDescription.assetGroup || "—"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-sm truncate">{risk.riskDescription.asset || "—"}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold">{risk.inherentRiskScore}</p>
                          <Badge variant="outline" className={cn("text-xs", getRiskColor(risk.inherentRiskLevel))}>
                            {risk.inherentRiskLevel}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="text-xs">
                          {risk.treatmentPlan.treatmentOption || "—"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold">{risk.postTreatmentRiskScore}</p>
                          <Badge variant="outline" className={cn("text-xs", getRiskColor(risk.postTreatmentRiskLevel))}>
                            {risk.postTreatmentRiskLevel}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {locked ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-300 gap-1 whitespace-nowrap">
                              <RefreshCw className="h-3 w-3" />
                              Revision
                            </Badge>
                            <Lock className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Completed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing {filteredRisks.length} of {completedRisks.length} risk assessments
      </p>
    </div>
  );
}

