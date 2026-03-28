import { Request, Response } from "express";

// In-memory storage for risk assessment data (in production, use a real database)
const riskAssessmentDatabase: Record<string, any> = {};

export async function handleRiskAssessmentSave(req: Request, res: Response) {
  try {
    const { riskId, questionId, nistId, gapDescription, riskAssessmentData } = req.body;

    if (!riskId || !questionId || !nistId) {
      return res.status(400).json({
        error: "riskId, questionId, and nistId are required",
      });
    }

    if (!riskAssessmentData) {
      return res.status(400).json({ error: "riskAssessmentData is required" });
    }

    // Validate required fields from Step 1
    const riskDescription = riskAssessmentData.riskDescription;
    if (
      !riskDescription.assetGroup ||
      !riskDescription.asset ||
      !riskDescription.threat ||
      !riskDescription.vulnerability ||
      !riskDescription.riskType
    ) {
      return res.status(400).json({
        error: "All Risk Description fields are required",
      });
    }

    // Validate Step 2
    const preTreatment = riskAssessmentData.preTreatmentAssessment;
    if (!preTreatment.likelihoodRationale || !preTreatment.impactRationale) {
      return res.status(400).json({
        error: "Likelihood and Impact Rationales are required",
      });
    }

    // Validate Step 3
    const treatmentPlan = riskAssessmentData.treatmentPlan;
    if (!treatmentPlan.treatmentOption || !treatmentPlan.proposedTreatmentAction) {
      return res.status(400).json({
        error: "Treatment Option and Proposed Treatment Action are required",
      });
    }

    // Store risk assessment data
    const riskAssessmentEntry = {
      riskId,
      questionId,
      nistId,
      gapDescription,
      ...riskAssessmentData,
      savedAt: new Date().toISOString(),
    };

    riskAssessmentDatabase[riskId] = riskAssessmentEntry;

    // Log for debugging
    console.log("✅ Risk assessment saved:", {
      riskId,
      status: riskAssessmentData.status,
      maturityScore: riskAssessmentData.maturityScore,
      nistId,
      questionId,
    });

    res.status(200).json({
      success: true,
      message: "Risk assessment saved successfully",
      riskId,
      status: riskAssessmentData.status,
      maturityScore: riskAssessmentData.maturityScore,
      inherentRiskLevel: riskAssessmentData.inherentRiskLevel,
      postTreatmentRiskLevel: riskAssessmentData.postTreatmentRiskLevel,
    });
  } catch (error) {
    console.error("Error saving risk assessment:", error);
    res.status(500).json({
      error: "Failed to save risk assessment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetRiskAssessments(req: Request, res: Response) {
  try {
    res.status(200).json({
      success: true,
      riskAssessments: Object.values(riskAssessmentDatabase),
      count: Object.keys(riskAssessmentDatabase).length,
    });
  } catch (error) {
    console.error("Error fetching risk assessments:", error);
    res.status(500).json({
      error: "Failed to fetch risk assessments",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetRiskAssessmentByQuestionId(req: Request, res: Response) {
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return res.status(400).json({ error: "questionId is required" });
    }

    const riskAssessment = Object.values(riskAssessmentDatabase).find(
      (ra: any) => ra.questionId === questionId
    );

    if (!riskAssessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    res.status(200).json({
      success: true,
      riskAssessment,
    });
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    res.status(500).json({
      error: "Failed to fetch risk assessment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetRiskAssessmentByRiskId(req: Request, res: Response) {
  try {
    const { riskId } = req.params;

    if (!riskId) {
      return res.status(400).json({ error: "riskId is required" });
    }

    const riskAssessment = riskAssessmentDatabase[riskId];

    if (!riskAssessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    res.status(200).json({
      success: true,
      riskAssessment,
    });
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    res.status(500).json({
      error: "Failed to fetch risk assessment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetCompletedRisks(req: Request, res: Response) {
  try {
    const completedRisks = Object.values(riskAssessmentDatabase).filter(
      (ra: any) => ra.status === "Completed"
    );

    res.status(200).json({
      success: true,
      riskRegister: completedRisks,
      count: completedRisks.length,
    });
  } catch (error) {
    console.error("Error fetching completed risks:", error);
    res.status(500).json({
      error: "Failed to fetch completed risks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
