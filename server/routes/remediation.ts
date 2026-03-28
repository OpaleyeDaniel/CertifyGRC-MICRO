import { Request, Response } from "express";

// In-memory storage for remediation data (in production, use a real database)
const remediationDatabase: Record<string, any> = {};

export async function handleRemediationSave(req: Request, res: Response) {
  try {
    const { questionId, nistId, function: functionName, category, remediationData } = req.body;

    if (!questionId || !nistId) {
      return res.status(400).json({ error: "questionId and nistId are required" });
    }

    if (!remediationData) {
      return res.status(400).json({ error: "remediationData is required" });
    }

    // Validate required fields
    if (!remediationData.rootCause || !remediationData.actionPlan) {
      return res.status(400).json({ error: "rootCause and actionPlan are required" });
    }

    // Store remediation data
    const remediationEntry = {
      questionId,
      nistId,
      function: functionName,
      category,
      ...remediationData,
      savedAt: new Date().toISOString(),
    };

    remediationDatabase[questionId] = remediationEntry;

    // Log for debugging
    console.log("Remediation saved:", remediationEntry);

    res.status(200).json({
      success: true,
      message: "Remediation saved successfully",
      remediationId: questionId,
      status: remediationData.status,
      evidenceCount: remediationData.evidenceFiles?.length || 0,
    });
  } catch (error) {
    console.error("Error saving remediation:", error);
    res.status(500).json({
      error: "Failed to save remediation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetRemediations(req: Request, res: Response) {
  try {
    res.status(200).json({
      success: true,
      remediations: Object.values(remediationDatabase),
      count: Object.keys(remediationDatabase).length,
    });
  } catch (error) {
    console.error("Error fetching remediations:", error);
    res.status(500).json({
      error: "Failed to fetch remediations",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleGetRemediationByQuestion(req: Request, res: Response) {
  try {
    const { questionId } = req.params;

    if (!questionId) {
      return res.status(400).json({ error: "questionId is required" });
    }

    const remediation = remediationDatabase[questionId];

    if (!remediation) {
      return res.status(404).json({ error: "Remediation not found" });
    }

    res.status(200).json({
      success: true,
      remediation,
    });
  } catch (error) {
    console.error("Error fetching remediation:", error);
    res.status(500).json({
      error: "Failed to fetch remediation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleUploadEvidence(req: Request, res: Response) {
  try {
    const { questionId, fileName, fileSize, fileType } = req.body;

    if (!questionId || !fileName) {
      return res.status(400).json({ error: "questionId and fileName are required" });
    }

    // Store file metadata
    const fileMetadata = {
      name: fileName,
      type: fileType,
      size: fileSize,
      uploadedAt: new Date().toISOString(),
      url: `/evidence/${questionId}/${fileName}`,
    };

    // Update remediation with file info
    if (remediationDatabase[questionId]) {
      const evidenceFiles = remediationDatabase[questionId].evidenceFiles || [];
      remediationDatabase[questionId].evidenceFiles = [...evidenceFiles, fileMetadata];
      remediationDatabase[questionId].updatedAt = new Date().toISOString();
    }

    console.log("Evidence uploaded:", fileMetadata);

    res.status(200).json({
      success: true,
      message: "Evidence uploaded successfully",
      fileMetadata,
    });
  } catch (error) {
    console.error("Error uploading evidence:", error);
    res.status(500).json({
      error: "Failed to upload evidence",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleSaveDraft(req: Request, res: Response) {
  try {
    const { questionId, nistId, function: functionName, category, remediationData } = req.body;

    if (!questionId || !nistId) {
      return res.status(400).json({ error: "questionId and nistId are required" });
    }

    if (!remediationData) {
      return res.status(400).json({ error: "remediationData is required" });
    }

    // Validate required fields for draft
    if (!remediationData.rootCause || !remediationData.actionPlan) {
      return res.status(400).json({ error: "rootCause and actionPlan are required" });
    }

    // Store draft remediation data
    const draftEntry = {
      questionId,
      nistId,
      function: functionName,
      category,
      ...remediationData,
      status: "Draft",
      savedAt: new Date().toISOString(),
      isDraft: true,
    };

    remediationDatabase[questionId] = draftEntry;

    console.log("Remediation draft saved:", draftEntry);

    res.status(200).json({
      success: true,
      message: "Remediation saved as draft successfully",
      remediationId: questionId,
      status: "Draft",
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({
      error: "Failed to save draft",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function handleSubmitRemediation(req: Request, res: Response) {
  try {
    const { questionId, nistId, function: functionName, category, remediationData } = req.body;

    if (!questionId || !nistId) {
      return res.status(400).json({ error: "questionId and nistId are required" });
    }

    if (!remediationData) {
      return res.status(400).json({ error: "remediationData is required" });
    }

    // Validate all required fields for submission
    if (!remediationData.rootCause || !remediationData.actionPlan) {
      return res.status(400).json({ error: "rootCause and actionPlan are required" });
    }

    if (!remediationData.evidenceFiles || remediationData.evidenceFiles.length === 0) {
      return res.status(400).json({ error: "At least one evidence file is required" });
    }

    if (!remediationData.documentType) {
      return res.status(400).json({ error: "documentType is required" });
    }

    if (!remediationData.legallyAttested) {
      return res.status(400).json({ error: "Legal attestation is required" });
    }

    // Store submitted remediation data with audit trail
    const submittedEntry = {
      questionId,
      nistId,
      function: functionName,
      category,
      ...remediationData,
      status: "Treated",
      isDraft: false,
      submittedAt: new Date().toISOString(),
      auditTrail: {
        submissionTimestamp: new Date().toISOString(),
        evidenceCount: remediationData.evidenceFiles.length,
        documentType: remediationData.documentType,
        legallyAttested: true,
      },
    };

    remediationDatabase[questionId] = submittedEntry;

    console.log("Remediation submitted:", submittedEntry);

    res.status(200).json({
      success: true,
      message: "Remediation submitted successfully as Treated",
      remediationId: questionId,
      status: "Treated",
      evidenceCount: remediationData.evidenceFiles.length,
      auditTrail: submittedEntry.auditTrail,
    });
  } catch (error) {
    console.error("Error submitting remediation:", error);
    res.status(500).json({
      error: "Failed to submit remediation",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
