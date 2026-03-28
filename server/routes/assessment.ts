import { Request, Response } from "express";

interface AssessmentResponse {
  nist_id: string;
  question_text: string;
  score: number;
  comment?: string;
  page: string;
  timestamp?: string;
}

interface AssessmentSubmission {
  function: string;
  responses: AssessmentResponse[];
  completionStats: {
    completed: number;
    total: number;
    percentage: number;
  };
  detectedGaps: number;
}

export async function handleAssessmentSubmit(req: Request, res: Response) {
  try {
    const { function: functionName } = req.query;
    const payload: AssessmentSubmission = req.body;

    if (!functionName) {
      return res.status(400).json({ error: "Function parameter is required" });
    }

    if (!payload || !payload.responses || !Array.isArray(payload.responses)) {
      return res.status(400).json({ error: "Invalid assessment payload" });
    }

    // Validate each response
    const validatedResponses = payload.responses.map((r) => ({
      nist_id: r.nist_id,
      question_text: r.question_text,
      score: Math.max(0, Math.min(5, r.score)), // Clamp score between 0-5
      comment: r.comment || undefined,
      page: r.page,
      timestamp: r.timestamp || new Date().toISOString(),
    }));

    // Process assessment data
    const assessment = {
      function: functionName,
      submittedAt: new Date().toISOString(),
      completionStats: payload.completionStats,
      detectedGaps: payload.detectedGaps,
      responses: validatedResponses,
      summary: {
        totalResponses: validatedResponses.length,
        averageScore: Math.round((validatedResponses.reduce((sum, r) => sum + r.score, 0) / validatedResponses.length) * 10) / 10,
        gapCount: validatedResponses.filter((r) => r.score <= 2).length,
      },
    };

    // Log the submission (in a real app, this would be stored in a database)
    console.log("Assessment submitted:", assessment);

    // Auto-create improvement action items for detected gaps
    if (assessment.detectedGaps > 0) {
      const gapItems = validatedResponses
        .filter((r) => r.score <= 2)
        .map((r) => ({
          id: `IMPROVEMENT-${r.nist_id}-${Date.now()}`,
          title: `Improve ${r.nist_id}: ${r.question_text}`,
          description: r.comment || `Gap detected with maturity score of ${r.score}/5`,
          status: "Open",
          priority: r.score === 0 ? "Critical" : "High",
          relatedFunction: functionName,
          createdAt: new Date().toISOString(),
        }));

      console.log("Auto-created improvement items:", gapItems);

      return res.status(200).json({
        success: true,
        message: `Assessment submitted successfully. ${assessment.detectedGaps} gap(s) detected and improvement items auto-created.`,
        assessment,
        improvementItems: gapItems,
      });
    }

    res.status(200).json({
      success: true,
      message: "Assessment submitted successfully.",
      assessment,
      improvementItems: [],
    });
  } catch (error) {
    console.error("Error processing assessment submission:", error);
    res.status(500).json({
      error: "Failed to process assessment submission",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
