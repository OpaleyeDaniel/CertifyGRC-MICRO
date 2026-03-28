/**
 * Risk Assessment Data Types
 * Manages the risk assessment workflow for identified gaps
 */

// Section 1: Risk Description
export interface RiskDescription {
  assetGroup: "Information" | "Business activities" | "Software" | "Hardware" | "Personnel" | "Physical site" | "";
  asset: string;
  threat: string;
  vulnerability: string;
  riskType: ("C" | "I" | "A")[]; // CIA Triad - Multi-select array
  riskOwner: string;
  existingControls: string;
}

// Section 2: Pre-Treatment Assessment
export interface PreTreatmentAssessment {
  likelihood: number; // 1-5
  likelihoodRationale: string;
  impact: number; // 1-5
  impactRationale: string;
}

// Section 3: Treatment Plan & Projection
export interface TreatmentPlan {
  treatmentOption: "Modify" | "Retain" | "Avoid" | "Transfer" | "";
  proposedTreatmentAction: string;
  controlReference: string; // Annex A / Control Reference
  treatmentCost: string;
  treatmentActionOwner: string;
  treatmentActionTimescale: string;
  treatmentActionProgress: string;
}

// Residual Scoring
export interface ResidualScoring {
  postTreatmentLikelihood: number; // 1-5
  postTreatmentImpact: number; // 1-5
}

// Complete Risk Assessment
export interface RiskAssessment {
  // Identification
  riskId: string; // Unique ID for this risk
  questionId: string; // Maps to Assessment Question ID
  nistId: string;
  gapDescription: string; // Gap Title from assessment
  function: string; // NIST Function (GOVERN, IDENTIFY, etc.)
  category: string; // Gap category
  
  // Step 1: Risk Description
  riskDescription: RiskDescription;

  // Step 2: Pre-Treatment Assessment
  preTreatmentAssessment: PreTreatmentAssessment;
  
  // Calculated fields
  inherentRiskScore: number; // Likelihood × Impact
  inherentRiskLevel: "LOW" | "MEDIUM" | "HIGH";

  // Step 3: Treatment Plan & Projection
  treatmentPlan: TreatmentPlan;
  residualScoring: ResidualScoring;
  postTreatmentRiskScore: number; // Post-Treatment Likelihood × Post-Treatment Impact
  postTreatmentRiskLevel: "LOW" | "MEDIUM" | "HIGH";

  // Status & Metadata
  status: "Pending" | "In Progress" | "Completed";
  createdAt: string;
  updatedAt: string;

  // Maturity Progression (Risk Assessment stage)
  maturityScore?: number; // Maturity level achieved after risk assessment completion (1-5)
}

// State management
export interface RiskAssessmentState {
  [riskId: string]: RiskAssessment;
}

// Risk Register (summary view)
export interface RiskRegisterEntry {
  riskId: string;
  nistId: string;
  gapDescription: string;
  assetGroup: string;
  riskType: string;
  inherentRiskScore: number;
  inherentRiskLevel: string;
  treatmentOption: string;
  postTreatmentRiskScore: number;
  postTreatmentRiskLevel: string;
  status: string;
}

// Helper function to calculate risk level
export const calculateRiskLevel = (score: number): "LOW" | "MEDIUM" | "HIGH" => {
  if (score >= 1 && score <= 8) return "LOW";
  if (score >= 9 && score <= 14) return "MEDIUM";
  if (score >= 15 && score <= 25) return "HIGH";
  return "LOW";
};

// Helper function to create empty risk assessment
export const createEmptyRiskAssessment = (
  questionId: string,
  nistId: string,
  gapDescription: string,
  functionName: string = "",
  category: string = ""
): RiskAssessment => ({
  riskId: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  questionId,
  nistId,
  gapDescription,
  function: functionName,
  category,
  
  riskDescription: {
    assetGroup: "",
    asset: "",
    threat: "",
    vulnerability: "",
    riskType: [],
    riskOwner: "",
    existingControls: "",
  },
  
  preTreatmentAssessment: {
    likelihood: 3,
    likelihoodRationale: "",
    impact: 3,
    impactRationale: "",
  },
  
  inherentRiskScore: 9,
  inherentRiskLevel: "MEDIUM",
  
  treatmentPlan: {
    treatmentOption: "",
    proposedTreatmentAction: "",
    controlReference: "",
    treatmentCost: "",
    treatmentActionOwner: "",
    treatmentActionTimescale: "",
    treatmentActionProgress: "",
  },
  
  residualScoring: {
    postTreatmentLikelihood: 2,
    postTreatmentImpact: 2,
  },
  
  postTreatmentRiskScore: 4,
  postTreatmentRiskLevel: "LOW",
  
  status: "Pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
