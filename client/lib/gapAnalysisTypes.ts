/**
 * Gap Analysis Phase Types
 * 
 * GRC Rules:
 * - Gaps are DERIVED from Assessment answers (source: maturityScore < 3, i.e., "No" or "Partial")
 * - Gap records store derived data + editable fields (severity, target, description)
 * - Source assessment data is READ-ONLY from this view
 * - Gap status (Open/Closed) is auto-calculated
 * - Full audit trail maintained via timestamps and change tracking
 */

export interface GapRecord {
  // Core identification
  id: string; // Unique gap ID
  nist_id: string; // Link to source question
  nist_function: string; // GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER
  nist_category: string; // Category within function
  
  // Source data (READ-ONLY - derived from Assessment)
  sourceQuestionText: string;
  sourceAnswer: string | null; // "Yes", "Partial", "No"
  sourceMaturityScore: number | null; // 1-5 score from assessment (null if unanswered)

  // Derived fields (calculated)
  gap_flag: boolean; // true if maturityScore < 3
  currentState: number | null; // Derived from source maturityScore (null if unanswered)
  
  // Editable fields (writable in Gap Analysis phase)
  targetState: number; // 0-5, target maturity level
  severity: "Low" | "Medium" | "High" | "Critical"; // User-assigned severity
  gapDescription: string; // Custom description of the gap
  
  // Status (auto-calculated)
  gapStatus: "Open" | "Closed"; // Closed when all required fields populated
  isComplete: boolean; // Validation: targetState > currentState && gapDescription.length > 0
  
  // Metadata
  createdAt: string; // ISO timestamp when gap was identified
  lastModified: string; // ISO timestamp of last change
  assignedTo?: string; // Owner responsible for remediation
  
  // Audit trail
  auditLog: GapAuditEntry[];
}

export interface GapAuditEntry {
  timestamp: string;
  action: "created" | "modified" | "field_updated" | "status_changed";
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string; // User who made the change
}

export interface GapAnalysisMetrics {
  totalGaps: number;
  openGaps: number;
  closedGaps: number;
  criticalGaps: number;
  highGaps: number;
  completionRate: number; // % of gaps with complete information
}

export interface GapsByFunction {
  function: string;
  gaps: GapRecord[];
  metrics: {
    total: number;
    open: number;
    critical: number;
    high: number;
  };
}

/**
 * Gap Validation Rules (GRC Compliance)
 */
export const GapValidationRules = {
  canEditSourceData: false, // Never allow editing of source assessment data
  requiresTargetState: true, // Must set target state
  requiresGapDescription: true, // Must describe the gap
  requiresSeverity: true, // Must assign severity
  minTargetStateAboveCurrent: true, // Target must be > current
} as const;
