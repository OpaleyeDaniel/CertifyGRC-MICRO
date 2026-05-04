import type { ClauseSection, AssessmentQuestion } from "./types";

/**
 * ISO 27001:2022 — Clause question bank (Clauses 4 to 10).
 *
 * Every question is layered (existence → documentation → implementation →
 * effectiveness → review) and carries evidence expectations that an
 * external auditor would realistically ask for.
 */

const q = (p: AssessmentQuestion): AssessmentQuestion => p;

/* -------------------------------------------------------------------- */
/* Clause 4 — Context of the Organisation                               */
/* -------------------------------------------------------------------- */

const clause4Questions: AssessmentQuestion[] = [
  q({
    id: "c4-1-internal-external-issues",
    reference: "4.1",
    title: "Internal and external issues",
    text: "Has the organisation identified the internal and external issues that are relevant to its purpose and that affect its ability to achieve the intended outcomes of the ISMS?",
    guidance:
      "Consider strategic drivers, regulatory environment, market dynamics, internal culture, technology change, and supply chain. Output should be a documented context analysis refreshed at least annually.",
    whyItMatters:
      "Without understanding context, the ISMS scope, risks and objectives cannot be justified to an auditor.",
    answerType: "implementation-status",
    depth: "documentation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Context analysis / PESTLE / SWOT document", type: "policy" },
      { id: "ev2", label: "Strategic plan extract referencing information security", type: "report" },
      { id: "ev3", label: "Minutes of leadership meeting discussing context", type: "meeting-minutes" },
    ],
    evidenceRequired: true,
    followUp: {
      requireJustificationWhenAnswerIn: ["Not applicable"],
    },
  }),
  q({
    id: "c4-1-context-review",
    reference: "4.1",
    title: "Context review cadence",
    text: "How frequently is the context of the organisation reviewed and updated, and is there evidence of that review?",
    answerType: "single-select",
    depth: "review",
    category: "review",
    options: ["At least annually", "Ad-hoc / on major change", "Never documented", "Not applicable"],
    evidence: [
      { id: "ev1", label: "Review log or version history of context document" },
      { id: "ev2", label: "Management review minutes that discuss context changes" },
    ],
    weight: 1,
  }),
  q({
    id: "c4-2-interested-parties",
    reference: "4.2",
    title: "Interested parties and their requirements",
    text: "Has the organisation identified interested parties relevant to the ISMS and their information security, legal, regulatory and contractual requirements?",
    guidance:
      "Typical parties include customers, regulators, employees, investors, suppliers, partners, and data subjects. Requirements should be tracked in a register.",
    answerType: "implementation-status",
    depth: "documentation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Interested parties / stakeholder register" },
      { id: "ev2", label: "Legal & regulatory obligations register" },
      { id: "ev3", label: "Customer contract clauses on security" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c4-2-legal-register",
    reference: "4.2",
    title: "Legal & regulatory obligations register",
    text: "Is there a maintained register of applicable legal, regulatory and contractual information security obligations?",
    answerType: "yes-no",
    depth: "documentation",
    category: "policy",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Obligations register with owner and review date" },
      { id: "ev2", label: "Legal review attestation" },
    ],
    evidenceRequired: true,
    appliesWhen: ["handlesPii", "handlesPayments", "thirdPartyProcessors", "default"],
  }),
  q({
    id: "c4-3-scope-defined",
    reference: "4.3",
    title: "ISMS scope definition",
    text: "Is the scope of the ISMS formally defined, documented and approved, covering processes, locations, assets, and interfaces with third parties?",
    guidance:
      "Scope must identify boundaries and interfaces and consider the context and interested parties.",
    answerType: "implementation-status",
    depth: "documentation",
    category: "governance",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Approved ISMS scope statement" },
      { id: "ev2", label: "Scope diagram / architecture view", type: "architecture-diagram" },
    ],
    evidenceRequired: true,
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c4-3-scope-exclusions",
    reference: "4.3",
    title: "Scope exclusions and justifications",
    text: "Where parts of the organisation are excluded from the ISMS, are the exclusions explicitly documented and justified?",
    answerType: "yes-no",
    depth: "documentation",
    category: "governance",
    evidence: [{ id: "ev1", label: "Documented exclusion justifications inside the scope statement" }],
    followUp: { requireJustificationWhenAnswerIn: ["No", "Not applicable"] },
  }),
  q({
    id: "c4-3-interfaces-dependencies",
    reference: "4.3",
    title: "Interfaces and dependencies",
    text: "Have interfaces and dependencies with external parties (cloud providers, suppliers, subsidiaries, regulators) been mapped into the scope?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Interface & dependency map" },
      { id: "ev2", label: "Supplier inventory linked to scope" },
    ],
    appliesWhen: ["usesCloud", "thirdPartyProcessors", "outsourcedOperations"],
  }),
  q({
    id: "c4-4-isms-established",
    reference: "4.4",
    title: "ISMS established and maintained",
    text: "Is the ISMS established, implemented, maintained and continually improved in line with ISO 27001?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "implementation",
    weight: 3,
    evidence: [
      { id: "ev1", label: "ISMS manual or equivalent top-level documentation" },
      { id: "ev2", label: "Previous audit reports confirming maintenance" },
    ],
    maturityCeilingWithoutReview: 3,
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 5 — Leadership                                                */
/* -------------------------------------------------------------------- */

const clause5Questions: AssessmentQuestion[] = [
  q({
    id: "c5-1-commitment",
    reference: "5.1",
    title: "Top management commitment",
    text: "Does top management demonstrate leadership and commitment to the ISMS through policy approval, resource allocation and visible sponsorship?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "governance",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Signed ISMS policy by accountable executive" },
      { id: "ev2", label: "Budget approval for ISMS activities" },
      { id: "ev3", label: "Management review minutes showing active participation" },
    ],
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c5-2-policy-approved",
    reference: "5.2",
    title: "Information security policy approved",
    text: "Has an information security policy been approved by top management, documented, communicated, and made available to interested parties?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Approved & dated information security policy", type: "policy" },
      { id: "ev2", label: "Policy communication record (intranet, email acknowledgement)" },
    ],
    evidenceRequired: true,
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c5-2-policy-review",
    reference: "5.2",
    title: "Policy review frequency",
    text: "How frequently is the information security policy reviewed and re-approved?",
    answerType: "single-select",
    options: ["Annually", "Every 2 years", "On major change", "No defined cadence", "Not applicable"],
    depth: "review",
    category: "review",
    weight: 2,
    evidence: [{ id: "ev1", label: "Policy version history with approval signatures" }],
  }),
  q({
    id: "c5-3-roles-responsibilities",
    reference: "5.3",
    title: "Roles, responsibilities and authorities",
    text: "Are information security roles, responsibilities and authorities assigned and communicated within the organisation?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "RACI / responsibility matrix for ISMS roles" },
      { id: "ev2", label: "Job descriptions for CISO, ISMS manager, control owners" },
      { id: "ev3", label: "Board / exec delegation letter" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c5-3-isms-manager-designated",
    reference: "5.3",
    title: "ISMS manager designation",
    text: "Is a single individual formally designated with the authority to ensure ISMS conformity and to report ISMS performance to top management?",
    answerType: "yes-no",
    depth: "existence",
    category: "governance",
    weight: 2,
    evidence: [{ id: "ev1", label: "Written designation (email / memo / job description)" }],
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 6 — Planning                                                  */
/* -------------------------------------------------------------------- */

const clause6Questions: AssessmentQuestion[] = [
  q({
    id: "c6-1-1-general-risks",
    reference: "6.1.1",
    title: "Actions to address risks and opportunities",
    text: "Has the organisation determined the risks and opportunities that need to be addressed to ensure the ISMS can achieve its intended outcomes?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "ISMS-level risk & opportunity log" },
      { id: "ev2", label: "Integration into strategic planning" },
    ],
  }),
  q({
    id: "c6-1-2-risk-methodology",
    reference: "6.1.2",
    title: "Risk assessment methodology",
    text: "Is there a documented, repeatable information security risk assessment process, including criteria for accepting and performing risk assessments?",
    guidance:
      "Methodology must define asset/process scope, threat and vulnerability sources, likelihood & impact scales, risk acceptance criteria and ownership.",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Risk assessment methodology document" },
      { id: "ev2", label: "Risk scoring matrix (likelihood × impact)" },
    ],
    evidenceRequired: true,
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c6-1-2-repeatability",
    reference: "6.1.2",
    title: "Risk assessment repeatability",
    text: "Does the methodology produce consistent, valid and comparable results when applied by different assessors across the ISMS scope?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Training material for risk assessors" },
      { id: "ev2", label: "Calibration session minutes" },
    ],
    maturityCeilingWithoutReview: 3,
  }),
  q({
    id: "c6-1-3-risk-treatment-process",
    reference: "6.1.3",
    title: "Risk treatment process",
    text: "Is there a documented process for selecting risk treatment options and determining the controls necessary to implement them?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Risk treatment procedure" },
      { id: "ev2", label: "Mapping of selected treatments to Annex A controls" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c6-1-3-soa-produced",
    reference: "6.1.3",
    title: "Statement of Applicability produced",
    text: "Has a Statement of Applicability been produced that lists all Annex A controls, justifications for inclusion/exclusion, and implementation status?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Approved, version-controlled SoA", type: "policy" },
      { id: "ev2", label: "Evidence of approval by ISMS owner" },
    ],
    evidenceRequired: true,
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c6-1-3-treatment-plan-approved",
    reference: "6.1.3",
    title: "Risk treatment plan approval",
    text: "Is the risk treatment plan approved by risk owners and residual risk accepted by accountable management?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Signed risk treatment plan" },
      { id: "ev2", label: "Residual risk acceptance records" },
    ],
  }),
  q({
    id: "c6-2-objectives",
    reference: "6.2",
    title: "Information security objectives",
    text: "Have measurable information security objectives been established, consistent with the policy, and communicated to relevant functions?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Objectives register with targets, owners and due dates" },
      { id: "ev2", label: "Balanced scorecard / KPI dashboard" },
    ],
  }),
  q({
    id: "c6-2-objectives-tracking",
    reference: "6.2",
    title: "Objectives tracking",
    text: "Are security objectives monitored, measured and reported to top management on a defined cadence?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "monitoring",
    weight: 2,
    evidence: [{ id: "ev1", label: "KPI / KRI reports to the board or exec committee" }],
    maturityCeilingWithoutReview: 3,
  }),
  q({
    id: "c6-3-planning-changes",
    reference: "6.3",
    title: "Planning of changes to the ISMS",
    text: "Are changes to the ISMS planned in a structured way, considering purpose, consequences, resources, and responsibilities?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    evidence: [
      { id: "ev1", label: "Change management procedure for the ISMS" },
      { id: "ev2", label: "Approved change records" },
    ],
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 7 — Support                                                   */
/* -------------------------------------------------------------------- */

const clause7Questions: AssessmentQuestion[] = [
  q({
    id: "c7-1-resources",
    reference: "7.1",
    title: "Resources for the ISMS",
    text: "Have adequate resources been determined and provided for the establishment, implementation, maintenance and continual improvement of the ISMS?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "governance",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Approved ISMS budget" },
      { id: "ev2", label: "Organisation chart for the security team" },
    ],
  }),
  q({
    id: "c7-2-competence",
    reference: "7.2",
    title: "Competence of personnel",
    text: "Have competency requirements been defined for personnel performing ISMS-relevant roles, and is competence tracked and evidenced?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Competency matrix for ISMS roles" },
      { id: "ev2", label: "Certifications and training records" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c7-3-awareness",
    reference: "7.3",
    title: "Awareness programme",
    text: "Are personnel aware of the security policy, their contribution to the ISMS, and the implications of not conforming?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Awareness programme plan" },
      { id: "ev2", label: "Completion reports and phishing simulation results" },
    ],
    maturityCeilingWithoutReview: 3,
  }),
  q({
    id: "c7-4-communication",
    reference: "7.4",
    title: "Communication plan",
    text: "Has a plan been defined for internal and external communications relevant to the ISMS (what, when, to whom, by whom)?",
    answerType: "yes-no",
    depth: "documentation",
    category: "policy",
    evidence: [{ id: "ev1", label: "ISMS communication plan" }],
  }),
  q({
    id: "c7-5-1-documented-info-general",
    reference: "7.5.1",
    title: "Documented information — general",
    text: "Does the ISMS include the documented information required by the standard and that determined by the organisation as necessary for its effectiveness?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 2,
    evidence: [{ id: "ev1", label: "Document master list / index" }],
  }),
  q({
    id: "c7-5-2-creation-update",
    reference: "7.5.2",
    title: "Document creation and update controls",
    text: "Are documented information items properly identified (title, author, date, version) and reviewed and approved for suitability?",
    answerType: "yes-no",
    depth: "documentation",
    category: "policy",
    weight: 2,
    evidence: [{ id: "ev1", label: "Documentation control procedure" }],
  }),
  q({
    id: "c7-5-3-control-of-documented",
    reference: "7.5.3",
    title: "Control of documented information",
    text: "Are documented information items protected against loss of confidentiality, improper use, or loss of integrity — including distribution, access, retrieval, retention and disposition?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "monitoring",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Access control configuration for document repositories" },
      { id: "ev2", label: "Retention schedule" },
    ],
    maturityCeilingWithoutReview: 3,
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 8 — Operation                                                 */
/* -------------------------------------------------------------------- */

const clause8Questions: AssessmentQuestion[] = [
  q({
    id: "c8-1-operational-planning",
    reference: "8.1",
    title: "Operational planning and control",
    text: "Does the organisation plan, implement and control the processes needed to meet ISMS requirements and to implement the actions determined in 6.1?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Operational procedures for security processes" },
      { id: "ev2", label: "Ticketing evidence of process execution" },
    ],
  }),
  q({
    id: "c8-1-outsourced",
    reference: "8.1",
    title: "Outsourced processes",
    text: "Are outsourced processes that affect the ISMS determined and controlled?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Supplier inventory highlighting ISMS-relevant suppliers" },
      { id: "ev2", label: "Contract clauses covering security obligations" },
    ],
    appliesWhen: ["outsourcedOperations", "thirdPartyProcessors", "usesCloud"],
  }),
  q({
    id: "c8-2-risk-assessments-executed",
    reference: "8.2",
    title: "Risk assessments executed",
    text: "Are information security risk assessments performed at planned intervals or when significant changes are proposed or occur?",
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Risk assessment results" },
      { id: "ev2", label: "Change-triggered risk reassessment records" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c8-3-treatment-plan-implemented",
    reference: "8.3",
    title: "Risk treatment plan implemented",
    text: "Is the information security risk treatment plan implemented, with action progress tracked and residual risks reassessed?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "monitoring",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Risk treatment plan status report" },
      { id: "ev2", label: "Updated risk register with residual scores" },
    ],
    maturityCeilingWithoutReview: 3,
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 9 — Performance evaluation                                    */
/* -------------------------------------------------------------------- */

const clause9Questions: AssessmentQuestion[] = [
  q({
    id: "c9-1-monitoring",
    reference: "9.1",
    title: "Monitoring, measurement, analysis and evaluation",
    text: "Has the organisation determined what needs to be monitored, the methods, frequencies, who analyses results and how they are reported?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 2,
    evidence: [
      { id: "ev1", label: "Measurement plan with KPIs and KRIs" },
      { id: "ev2", label: "Sample monitoring report" },
    ],
  }),
  q({
    id: "c9-2-internal-audit-program",
    reference: "9.2",
    title: "Internal audit programme",
    text: "Is there an internal audit programme covering scope, criteria, frequency and methods, and are auditors independent of the areas they audit?",
    answerType: "implementation-status",
    depth: "documentation",
    category: "governance",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Approved internal audit plan", type: "audit-record" },
      { id: "ev2", label: "Auditor independence declarations" },
    ],
    evidenceRequired: true,
    reviewerApprovalRequired: true,
  }),
  q({
    id: "c9-2-internal-audits-executed",
    reference: "9.2",
    title: "Internal audits executed",
    text: "Are audits conducted according to the plan, with results documented, retained and reported to management?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "monitoring",
    weight: 2,
    evidence: [{ id: "ev1", label: "Internal audit reports with findings and status" }],
    maturityCeilingWithoutReview: 3,
  }),
  q({
    id: "c9-3-management-review-inputs",
    reference: "9.3",
    title: "Management review inputs",
    text: "Do management reviews consider all required inputs: status of actions, changes in context, performance indicators, feedback from interested parties, risk results, opportunities for improvement?",
    answerType: "yes-no",
    depth: "implementation",
    category: "governance",
    weight: 3,
    evidence: [{ id: "ev1", label: "Management review deck / minutes with all required inputs" }],
    evidenceRequired: true,
  }),
  q({
    id: "c9-3-management-review-outputs",
    reference: "9.3",
    title: "Management review outputs",
    text: "Do management reviews result in documented decisions and actions related to continual improvement and changes to the ISMS?",
    answerType: "yes-no",
    depth: "effectiveness",
    category: "governance",
    weight: 3,
    evidence: [
      { id: "ev1", label: "Management review action log" },
      { id: "ev2", label: "Evidence that actions are tracked to closure" },
    ],
  }),
];

/* -------------------------------------------------------------------- */
/* Clause 10 — Improvement                                              */
/* -------------------------------------------------------------------- */

const clause10Questions: AssessmentQuestion[] = [
  q({
    id: "c10-1-continual-improvement",
    reference: "10.1",
    title: "Continual improvement",
    text: "Does the organisation continually improve the suitability, adequacy and effectiveness of the ISMS?",
    answerType: "maturity",
    depth: "effectiveness",
    category: "review",
    weight: 2,
    evidence: [{ id: "ev1", label: "Improvement register with trends / lessons-learnt log" }],
    maturityCeilingWithoutReview: 3,
  }),
  q({
    id: "c10-2-nonconformity",
    reference: "10.2",
    title: "Nonconformity and corrective action",
    text: "When a nonconformity occurs, does the organisation react, evaluate the need for action, implement the action, review effectiveness, update risks, and make changes to the ISMS as needed?",
    answerType: "implementation-status",
    depth: "effectiveness",
    category: "implementation",
    weight: 3,
    evidence: [
      { id: "ev1", label: "CAPA register with root cause and verification" },
      { id: "ev2", label: "Evidence of post-implementation review" },
    ],
    evidenceRequired: true,
  }),
  q({
    id: "c10-2-recurrence-prevention",
    reference: "10.2",
    title: "Prevention of recurrence",
    text: "Is there evidence that corrective actions prevent recurrence (effectiveness verification, trend analysis)?",
    answerType: "yes-no",
    depth: "effectiveness",
    category: "monitoring",
    weight: 2,
    evidence: [{ id: "ev1", label: "Trend analysis of repeat findings" }],
  }),
];

export const ISO_CLAUSES: ClauseSection[] = [
  {
    id: "clause-4",
    number: "4",
    name: "Context of the organisation",
    summary:
      "Define internal/external issues, interested parties, scope and the ISMS itself — the foundation everything else is built on.",
    objectives: [
      "Document the organisation's context and strategic drivers",
      "Identify interested parties and their security expectations",
      "Define the ISMS scope with boundaries and interfaces",
      "Establish and maintain the ISMS",
    ],
    questions: clause4Questions,
  },
  {
    id: "clause-5",
    number: "5",
    name: "Leadership",
    summary:
      "Top management ownership of the ISMS, including policy, roles, responsibilities and visible commitment.",
    objectives: [
      "Demonstrate commitment of top management",
      "Approve and communicate an information security policy",
      "Assign roles and authorities for the ISMS",
    ],
    questions: clause5Questions,
  },
  {
    id: "clause-6",
    number: "6",
    name: "Planning",
    summary:
      "Risk-based planning — methodology, risk treatment, controls selection, SoA and information security objectives.",
    objectives: [
      "Run repeatable risk assessments",
      "Treat risks and produce a Statement of Applicability",
      "Set measurable ISMS objectives",
      "Plan ISMS changes",
    ],
    questions: clause6Questions,
  },
  {
    id: "clause-7",
    number: "7",
    name: "Support",
    summary:
      "Resources, competence, awareness, communication, and the control of documented information.",
    objectives: [
      "Provide resources for the ISMS",
      "Ensure personnel competence",
      "Run an awareness programme",
      "Control documented information",
    ],
    questions: clause7Questions,
  },
  {
    id: "clause-8",
    number: "8",
    name: "Operation",
    summary:
      "Operate the ISMS — risk assessments, treatment plan execution, control of outsourced operations.",
    objectives: [
      "Plan and control operational processes",
      "Execute risk assessments and treatment plans",
      "Control outsourced processes",
    ],
    questions: clause8Questions,
  },
  {
    id: "clause-9",
    number: "9",
    name: "Performance evaluation",
    summary:
      "Monitoring, measurement, internal audit and management review of ISMS performance.",
    objectives: [
      "Monitor and measure ISMS performance",
      "Run an internal audit programme",
      "Conduct management reviews",
    ],
    questions: clause9Questions,
  },
  {
    id: "clause-10",
    number: "10",
    name: "Improvement",
    summary: "Corrective action, nonconformity handling and continual improvement of the ISMS.",
    objectives: [
      "Manage nonconformities and corrective actions",
      "Drive continual improvement",
    ],
    questions: clause10Questions,
  },
];

export function getAllClauseQuestions(): AssessmentQuestion[] {
  return ISO_CLAUSES.flatMap((c) => c.questions);
}
