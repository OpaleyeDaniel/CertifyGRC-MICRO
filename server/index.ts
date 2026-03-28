import "dotenv/config";
import express from "express";
import cors from "cors";

import { handleAssessmentSubmit } from "./routes/assessment";
import {
  handleRemediationSave,
  handleGetRemediations,
  handleGetRemediationByQuestion,
  handleUploadEvidence,
  handleSaveDraft,
  handleSubmitRemediation,
} from "./routes/remediation";
import {
  handleRiskAssessmentSave,
  handleGetRiskAssessments,
  handleGetRiskAssessmentByQuestionId,
  handleGetRiskAssessmentByRiskId,
  handleGetCompletedRisks,
} from "./routes/risk-assessment";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Assessment submission endpoint
  app.post("/api/assessment/submit", handleAssessmentSubmit);

  // Remediation endpoints
  app.post("/api/remediation/save", handleRemediationSave);
  app.post("/api/remediation/save-draft", handleSaveDraft);
  app.post("/api/remediation/submit", handleSubmitRemediation);
  app.get("/api/remediation/all", handleGetRemediations);
  app.get("/api/remediation/:questionId", handleGetRemediationByQuestion);
  app.post("/api/remediation/upload", handleUploadEvidence);

  // Risk Assessment endpoints
  // NOTE: static routes must be declared BEFORE dynamic /:riskId to prevent
  // Express matching "register" or "all" as a riskId param.
  app.post("/api/risk-assessment/save", handleRiskAssessmentSave);
  app.get("/api/risk-assessment/all", handleGetRiskAssessments);
  app.get("/api/risk-assessment/register/completed", handleGetCompletedRisks);
  app.get("/api/risk-assessment/question/:questionId", handleGetRiskAssessmentByQuestionId);
  app.get("/api/risk-assessment/:riskId", handleGetRiskAssessmentByRiskId);

  return app;
}
