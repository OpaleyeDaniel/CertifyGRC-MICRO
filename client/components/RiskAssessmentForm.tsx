import { useState, useMemo } from "react";
import { RiskAssessment, calculateRiskLevel } from "@/lib/gapRiskTypes";
import { useRiskAssessment } from "@/hooks/useRiskAssessment";
import { useGapRemediation } from "@/hooks/useGapRemediation";
import { useAssessmentEngine } from "@/hooks/useAssessmentEngine";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ChevronRight, ArrowLeft, HelpCircle, RefreshCw, AlertCircle } from "lucide-react";
import { QuarterlySelector } from "./QuarterlySelector";
import { TimeBasedProgressBar } from "./TimeBasedProgressBar";
import { SmartNistContextHeader } from "./SmartNistContextHeader";
import { CurrencyInput } from "./CurrencyInput";
import { formatCurrency, parseCurrency, isResidualScoringEnabled, Quarter } from "@/lib/treatmentPlanUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RiskAssessmentFormProps {
  questionId: string;
  nistId: string;
  gapDescription: string;
  functionName?: string;
  category?: string;
  isRevision?: boolean;
  auditorRiskComment?: string;
  onComplete: () => void;
  onBack: () => void;
}

type Step = 1 | 2 | 3;

export function RiskAssessmentForm({
  questionId,
  nistId,
  gapDescription,
  functionName = "",
  category = "",
  isRevision = false,
  auditorRiskComment,
  onComplete,
  onBack,
}: RiskAssessmentFormProps) {
  const { getOrCreateRiskAssessment, updateRiskAssessment, saveRiskAssessment } =
    useRiskAssessment();
  const { allRemediations } = useGapRemediation();
  const { allQuestions } = useAssessmentEngine();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | "">("");
  const [treatmentProgress, setTreatmentProgress] = useState(0);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Get or create the risk assessment
  const risk = useMemo(
    () => getOrCreateRiskAssessment(questionId, nistId, gapDescription, functionName, category),
    [questionId, nistId, gapDescription, functionName, category, getOrCreateRiskAssessment]
  );

  // Get the compliance status from the assessment question
  const complianceStatus = useMemo(() => {
    const question = allQuestions.find((q) => q.id === questionId);
    return question?.userAnswer || null;
  }, [questionId, allQuestions]);

  // Recalculate inherent risk score
  const inherentRiskScore = useMemo(() => {
    const likelihood = risk.preTreatmentAssessment.likelihood;
    const impact = risk.preTreatmentAssessment.impact;
    if (likelihood == null || impact == null) return null;
    return likelihood * impact;
  }, [risk.preTreatmentAssessment.likelihood, risk.preTreatmentAssessment.impact]);

  const inherentRiskLevel = inherentRiskScore == null ? null : calculateRiskLevel(inherentRiskScore);

  // Recalculate post-treatment risk score (for display purposes only, not used for maturity)
  const postTreatmentRiskScore = useMemo(() => {
    const likelihood = risk.residualScoring.postTreatmentLikelihood || 1;
    const impact = risk.residualScoring.postTreatmentImpact || 1;
    return likelihood * impact;
  }, [
    risk.residualScoring.postTreatmentLikelihood,
    risk.residualScoring.postTreatmentImpact,
  ]);

  const postTreatmentRiskLevel = calculateRiskLevel(postTreatmentRiskScore);

  // Helper to get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSaveAndFinalize = async () => {
    // Validate all required fields
    const requiredFields = [
      risk.riskDescription.assetGroup,
      risk.riskDescription.asset,
      risk.riskDescription.threat,
      risk.riskDescription.vulnerability,
      risk.riskDescription.riskOwner,
      risk.preTreatmentAssessment.likelihoodRationale,
      risk.preTreatmentAssessment.impactRationale,
      risk.treatmentPlan.treatmentOption,
      risk.treatmentPlan.proposedTreatmentAction,
    ];

    // Check basic required fields
    if (requiredFields.some((field) => !field)) {
      toast({
        title: "Incomplete Assessment",
        description: "Please fill in all required fields before finalizing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get remediation to access its current maturity score
      const remediation = allRemediations[questionId];
      const remediationCurrentScore = remediation?.currentScore ?? remediation?.initialScore ?? 1;

      // Risk Assessment maturity = Remediation maturity + 1 (capped at 5)
      const riskAssessmentMaturityScore = Math.min(remediationCurrentScore + 1, 5);

      console.log("🎯 RISK ASSESSMENT MATURITY PROGRESSION:", {
        questionId,
        remediationCurrentScore,
        calculatedMaturityScore: riskAssessmentMaturityScore,
        source: "Gap Analysis/Remediation current score + 1",
      });

      // Prepare data for API call
      const finalizedRisk = {
        ...risk,
        inherentRiskScore,
        inherentRiskLevel,
        postTreatmentRiskScore,
        postTreatmentRiskLevel,
        maturityScore: riskAssessmentMaturityScore,
        status: "Completed",
      };

      // Save to backend
      const response = await fetch("/api/risk-assessment/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riskId: finalizedRisk.riskId,
          questionId: finalizedRisk.questionId,
          nistId: finalizedRisk.nistId,
          gapDescription: finalizedRisk.gapDescription,
          riskAssessmentData: finalizedRisk,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save risk assessment");
      }

      // Update local state with maturity score from remediation progression
      console.log("✅ RISK ASSESSMENT FINALIZED:", {
        questionId,
        maturityScore: riskAssessmentMaturityScore,
        status: "Completed",
      });

      updateRiskAssessment(risk.riskId, {
        inherentRiskScore,
        inherentRiskLevel,
        postTreatmentRiskScore,
        postTreatmentRiskLevel,
        maturityScore: riskAssessmentMaturityScore,
        status: "Completed",
      });

      console.log("✅ STATE UPDATE COMPLETE - Risk assessment finalized");

      toast({
        title: "Success!",
        description: "Risk assessment finalized and moved to Risk Register.",
      });

      // Wait a brief moment to ensure state updates and localStorage sync
      setTimeout(() => {
        console.log("🔄 Navigating back to Risk Register...");
        onComplete();
      }, 500);
    } catch (error) {
      console.error("Error finalizing risk assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save risk assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Revision banner */}
      {isRevision && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-300 bg-orange-50">
          <RefreshCw className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-orange-900 text-sm">Revision — Risk Assessment</p>
            <p className="text-xs text-orange-800 mt-0.5">
              The auditor has requested a revision. Update your risk assessment below and finalise to continue.
            </p>
            {auditorRiskComment && (
              <div className="mt-2 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-700 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-900">
                  <span className="font-semibold">Auditor's note: </span>{auditorRiskComment}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Risk Assessment</h1>
            {isRevision && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 gap-1">
                <RefreshCw className="h-3 w-3" />
                Revision
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">
              {nistId} • {gapDescription}
            </p>
            {/* Compliance Status Badge */}
            {complianceStatus === "No" ? (
              <Badge className="bg-red-500 text-white">No</Badge>
            ) : complianceStatus === "Partial" ? (
              <Badge className="bg-yellow-500 text-white">Partial</Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {([1, 2, 3] as const).map((step) => (
          <div key={step} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(step)}
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step === currentStep
                  ? "bg-primary text-white"
                  : step < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step < currentStep ? <CheckCircle2 className="h-5 w-5" /> : step}
            </button>
            {step < 3 && <ChevronRight className="h-5 w-5 text-gray-400" />}
          </div>
        ))}
        <div className="ml-4">
          <p className="text-sm font-medium">
            Step {currentStep} of 3:{" "}
            {currentStep === 1
              ? "Risk Description"
              : currentStep === 2
              ? "Pre-Treatment Assessment"
              : "Treatment Plan & Projection"}
          </p>
        </div>
      </div>

      {/* Step 1: Risk Description */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Risk Description</CardTitle>
            <CardDescription>Define the risk context and scope</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Group */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Group *</label>
              <Select
                value={risk.riskDescription.assetGroup}
                onValueChange={(value) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      assetGroup: value as any,
                    },
                  })
                }
              >
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select asset group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Information">Information</SelectItem>
                  <SelectItem value="Business activities">Business activities</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Personnel">Personnel</SelectItem>
                  <SelectItem value="Physical site">Physical site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset *</label>
              <Input
                placeholder="e.g., Customer database, Cleaners, Web server"
                value={risk.riskDescription.asset}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      asset: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
              />
            </div>

            {/* Threat */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Threat *</label>
              <Textarea
                placeholder="e.g., External hacker gains access and steals confidential data"
                value={risk.riskDescription.threat}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      threat: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
                rows={3}
              />
            </div>

            {/* Vulnerability */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vulnerability *</label>
              <Textarea
                placeholder="e.g., Web server is accessible from the Internet"
                value={risk.riskDescription.vulnerability}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      vulnerability: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
                rows={3}
              />
            </div>

            {/* Risk Owner */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Risk Owner *</label>
              <Input
                placeholder="e.g., CIO, CISO, COO"
                value={risk.riskDescription.riskOwner}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      riskOwner: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
              />
            </div>

            {/* Existing Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Existing Controls</label>
              <Textarea
                placeholder="e.g., Server is hardened to industry standards"
                value={risk.riskDescription.existingControls}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    riskDescription: {
                      ...risk.riskDescription,
                      existingControls: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Pre-Treatment Assessment */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Pre-Treatment Assessment</CardTitle>
            <CardDescription>Evaluate likelihood and impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Likelihood */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Likelihood (1-5) *</label>
                <Select
                  value={risk.preTreatmentAssessment.likelihood ? String(risk.preTreatmentAssessment.likelihood) : ""}
                  onValueChange={(value) =>
                    updateRiskAssessment(risk.riskId, {
                      preTreatmentAssessment: {
                        ...risk.preTreatmentAssessment,
                        likelihood: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select likelihood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Impact (1-5) *</label>
                <Select
                  value={risk.preTreatmentAssessment.impact ? String(risk.preTreatmentAssessment.impact) : ""}
                  onValueChange={(value) =>
                    updateRiskAssessment(risk.riskId, {
                      preTreatmentAssessment: {
                        ...risk.preTreatmentAssessment,
                        impact: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Low</SelectItem>
                    <SelectItem value="2">2 - Low</SelectItem>
                    <SelectItem value="3">3 - Medium</SelectItem>
                    <SelectItem value="4">4 - High</SelectItem>
                    <SelectItem value="5">5 - Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Likelihood Rationale */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Likelihood Rationale *</label>
              <Textarea
                placeholder="e.g., There are many known attacks daily"
                value={risk.preTreatmentAssessment.likelihoodRationale}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    preTreatmentAssessment: {
                      ...risk.preTreatmentAssessment,
                      likelihoodRationale: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
                rows={3}
              />
            </div>

            {/* Impact Rationale */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Impact Rationale *</label>
              <Textarea
                placeholder="e.g., Significant fines and loss of reputation"
                value={risk.preTreatmentAssessment.impactRationale}
                onChange={(e) =>
                  updateRiskAssessment(risk.riskId, {
                    preTreatmentAssessment: {
                      ...risk.preTreatmentAssessment,
                      impactRationale: e.target.value,
                    },
                  })
                }
                className="bg-gray-50"
                rows={3}
              />
            </div>

            {/* Inherent Risk Score - Display Only */}
            <div className="grid grid-cols-2 gap-6 mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Inherent Risk Score</p>
                <p className="text-3xl font-bold">{inherentRiskScore == null ? "-" : inherentRiskScore}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                {inherentRiskLevel == null ? (
                  <span className="text-lg font-medium text-gray-500">-</span>
                ) : (
                  <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(inherentRiskLevel)}`}>
                    {inherentRiskLevel}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Treatment Plan & Projection */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Treatment Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Treatment Option */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Treatment Option *</label>
                <Select
                  value={risk.treatmentPlan.treatmentOption}
                  onValueChange={(value) =>
                    updateRiskAssessment(risk.riskId, {
                      treatmentPlan: {
                        ...risk.treatmentPlan,
                        treatmentOption: value as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="Select treatment option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Modify">Modify</SelectItem>
                    <SelectItem value="Retain">Retain</SelectItem>
                    <SelectItem value="Avoid">Avoid</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Proposed Treatment Action */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Proposed Treatment Action *</label>
                <Textarea
                  placeholder="e.g., Adopt a clear desk policy"
                  value={risk.treatmentPlan.proposedTreatmentAction}
                  onChange={(e) =>
                    updateRiskAssessment(risk.riskId, {
                      treatmentPlan: {
                        ...risk.treatmentPlan,
                        proposedTreatmentAction: e.target.value,
                      },
                    })
                  }
                  className="bg-gray-50"
                  rows={3}
                />
              </div>

              {/* Smart NIST Context Header */}
              <SmartNistContextHeader
                nistId={risk.nistId}
                function={risk.function}
                category={risk.category}
              />

              {/* Financials */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Treatment Cost (USD)</label>
                  <CurrencyInput
                    value={risk.treatmentPlan.treatmentCost}
                    onChange={(value) =>
                      updateRiskAssessment(risk.riskId, {
                        treatmentPlan: {
                          ...risk.treatmentPlan,
                          treatmentCost: value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Treatment Action Owner</label>
                  <Input
                    placeholder="e.g., IT Director"
                    value={risk.treatmentPlan.treatmentActionOwner}
                    onChange={(e) =>
                      updateRiskAssessment(risk.riskId, {
                        treatmentPlan: {
                          ...risk.treatmentPlan,
                          treatmentActionOwner: e.target.value,
                        },
                      })
                    }
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Quarterly Selector */}
              <QuarterlySelector
                selectedQuarter={selectedQuarter}
                onQuarterChange={(quarter) => {
                  setSelectedQuarter(quarter);
                  updateRiskAssessment(risk.riskId, {
                    treatmentPlan: {
                      ...risk.treatmentPlan,
                      treatmentActionTimescale: `${quarter} ${currentYear}`,
                    },
                  });
                }}
              />

              {/* Time-Based Progress Bar */}
              <TimeBasedProgressBar
                year={currentYear}
                quarter={selectedQuarter}
                onProgressChange={setTreatmentProgress}
              />
            </CardContent>
          </Card>

          {/* Residual Scoring - Gated by Progress */}
          <Card
            className={`transition-all ${
              isResidualScoringEnabled(treatmentProgress)
                ? ""
                : "opacity-50 pointer-events-none"
            }`}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Residual Scoring & Projection</CardTitle>
                <CardDescription>Estimate risk after treatment implementation</CardDescription>
              </div>
              {!isResidualScoringEnabled(treatmentProgress) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Residual scoring becomes available as the treatment action nears completion (70%+).</p>
                      <p className="text-xs mt-2">Current Progress: {treatmentProgress}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {!isResidualScoringEnabled(treatmentProgress) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Coming Soon:</strong> This section will be available once your treatment action progress reaches 70%.
                  </p>
                  <p className="text-xs text-orange-700 mt-2">
                    Current Progress: {treatmentProgress}% → Enable at 70%
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post-Treatment Likelihood (1-5)</label>
                  <Select
                    value={String(risk.residualScoring.postTreatmentLikelihood)}
                    onValueChange={(value) =>
                      updateRiskAssessment(risk.riskId, {
                        residualScoring: {
                          ...risk.residualScoring,
                          postTreatmentLikelihood: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post-Treatment Impact (1-5)</label>
                  <Select
                    value={String(risk.residualScoring.postTreatmentImpact)}
                    onValueChange={(value) =>
                      updateRiskAssessment(risk.riskId, {
                        residualScoring: {
                          ...risk.residualScoring,
                          postTreatmentImpact: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger className="bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Low</SelectItem>
                      <SelectItem value="2">2 - Low</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - High</SelectItem>
                      <SelectItem value="5">5 - Very High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Post-Treatment Risk Score - Display Only */}
              <div className="grid grid-cols-2 gap-6 mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Post-Treatment Risk Score</p>
                  <p className="text-3xl font-bold">{postTreatmentRiskScore}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                  <Badge className={`text-lg px-4 py-2 ${getRiskLevelColor(postTreatmentRiskLevel)}`}>
                    {postTreatmentRiskLevel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep((currentStep - 1) as Step);
            } else {
              onBack();
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? "Back to List" : "Previous"}
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={() => setCurrentStep((currentStep + 1) as Step)}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSaveAndFinalize} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Finalize Risk Register Entry
          </Button>
        )}
      </div>
    </div>
  );
}
