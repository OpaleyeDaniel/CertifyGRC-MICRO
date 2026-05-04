/**
 * Gap Remediation Data Types
 * Manages the remediation worksheet for each identified gap
 */

export interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url?: string; // URL to access the file
  sourceKind?: "local" | "cloud";
  storageMode?: "import" | "link";
  providerId?: string;
  externalFileId?: string;
  externalPath?: string;
  attachedBy?: string;
}

export interface GapRemediation {
  // Identification
  questionId: string; // Maps to Assessment Question ID (nist_id)
  nistId: string;
  question: string;
  category: string;
  function: string;

  // Remediation Worksheet
  rootCause: string; // Why the gap exists
  actionPlan: string; // User's custom remediation steps
  priority: "Critical" | "High" | "Medium" | "Low"; // Severity level
  expectedCompletionDate: string; // ISO date format
  evidence: string; // File name or path (uploaded evidence)
  evidenceFiles?: EvidenceFile[]; // Array of uploaded files

  // Maturity Tracking (for report display)
  initialScore?: number; // Original maturity score (1-5 or null) - captured on gap creation
  currentScore?: number; // Current maturity score after remediation promotion - updated on remediation completion

  // Status
  status: "Open" | "Draft" | "Treated";

  // Metadata
  createdAt: string;
  updatedAt: string;
  draftSavedDate?: string; // Timestamp when draft was saved
}

export interface GapRemediationState {
  [questionId: string]: GapRemediation;
}

// NIST CSF 2.0 Reference Data
export interface NISTReference {
  subcategory: string;
  informativeReferences: string[];
  recommendedImplementationExamples: string[];
}

// NIST Reference Database
export const nistReferences: Record<string, NISTReference> = {
  "GV.OC-01": {
    subcategory: "GV.OC-01: Organizational Context",
    informativeReferences: [
      "NIST SP 800-39: Managing Information Security Risk",
      "ISO/IEC 27001:2022: Information Security Management",
      "COSO Framework: Integrated Framework for Enterprise Risk Management",
    ],
    recommendedImplementationExamples: [
      "Document all critical business functions and supporting systems",
      "Maintain an up-to-date asset inventory with business impact classifications",
      "Conduct annual business continuity assessments",
      "Define criticality criteria based on organizational impact",
      "Implement automated asset discovery tools",
    ],
  },
  "GV.RM-01": {
    subcategory: "GV.RM-01: Risk Management Strategy",
    informativeReferences: [
      "NIST SP 800-39: Managing Information Security Risk",
      "ISO/IEC 31000:2018: Risk Management",
      "COSO ERM Framework",
    ],
    recommendedImplementationExamples: [
      "Develop a formal cybersecurity risk management framework",
      "Define risk assessment methodology and frequency",
      "Establish risk evaluation criteria and thresholds",
      "Document risk response strategies (mitigate, accept, transfer, avoid)",
      "Create risk management governance structure",
    ],
  },
  "ID.AM-01": {
    subcategory: "ID.AM-01: Asset Management",
    informativeReferences: [
      "NIST SP 800-53: Security and Privacy Controls",
      "ISO/IEC 27001:2022: Information Security Management",
      "COBIT 5: Governance and Management Practices",
    ],
    recommendedImplementationExamples: [
      "Implement hardware asset management system (e.g., ServiceNow, Jira Asset)",
      "Implement software asset management (SAM) solution",
      "Maintain cloud asset inventory across all platforms",
      "Conduct quarterly asset discovery scans",
      "Document asset ownership and business criticality",
      "Track asset lifecycle from acquisition to retirement",
    ],
  },
  "PR.AA-01": {
    subcategory: "PR.AA-01: Access Control",
    informativeReferences: [
      "NIST SP 800-53: Access Control",
      "ISO/IEC 27001:2022: Access Control",
      "CIS Controls v8: Secure Access Management",
    ],
    recommendedImplementationExamples: [
      "Implement Identity and Access Management (IAM) solution",
      "Enable multi-factor authentication (MFA) on all systems",
      "Implement zero trust access principles",
      "Establish principle of least privilege policies",
      "Conduct access reviews quarterly",
      "Implement privileged access management (PAM)",
    ],
  },
  "DE.CM-01": {
    subcategory: "DE.CM-01: Monitoring",
    informativeReferences: [
      "NIST SP 800-53: System Monitoring",
      "ISO/IEC 27001:2022: Monitoring and Measurement",
      "CIS Controls v8: Continuous Monitoring",
    ],
    recommendedImplementationExamples: [
      "Implement Security Information and Event Management (SIEM)",
      "Deploy endpoint detection and response (EDR) tools",
      "Implement network monitoring and analysis tools",
      "Enable logging across all critical systems",
      "Establish centralized log management",
      "Configure real-time alerting for security events",
    ],
  },
};

// Default/empty remediation template
export const createEmptyGapRemediation = (
  questionId: string,
  nistId: string,
  question: string,
  category: string,
  function_name: string,
  initialScore?: number | null // Optional: capture initial maturity score from assessment
): GapRemediation => ({
  questionId,
  nistId,
  question,
  category,
  function: function_name,
  rootCause: "",
  actionPlan: "",
  priority: "Medium",
  expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  evidence: "",
  initialScore: initialScore ?? undefined, // Store initial score for report display
  currentScore: initialScore ?? undefined, // Start with same as initial
  status: "Open",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Get NIST reference for a question, or return a default
export const getNISTReference = (nistId: string): NISTReference => {
  return (
    nistReferences[nistId] || {
      subcategory: `${nistId} - NIST CSF 2.0 Control`,
      informativeReferences: [
        "NIST SP 800-53: Security and Privacy Controls",
        "ISO/IEC 27001:2022: Information Security Management",
      ],
      recommendedImplementationExamples: [
        "Review NIST CSF 2.0 documentation for this control",
        "Consult with security architects and subject matter experts",
        "Review industry best practices and standards",
      ],
    }
  );
};
