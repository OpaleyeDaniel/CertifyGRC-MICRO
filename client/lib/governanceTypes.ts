// GOVERN Function Assessment Types
export interface GovernanceAssessmentResponse {
  nist_id: string;
  question_text: string;
  score: number;
  comment?: string;
  page: string;
  timestamp?: string;
}

export interface GovernanceCategoryAssessment {
  category: string;
  questions: GovernanceAssessmentResponse[];
  categoryScore: number;
}

export interface GovernanceSectionSummary {
  totalQuestions: number;
  completedQuestions: number;
  overallScore: number;
  detectedGaps: GovernanceAssessmentResponse[];
  hasGaps: boolean;
}
