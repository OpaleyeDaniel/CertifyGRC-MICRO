import type {
  AnnexControl,
  AnnexDomain,
  AnnexDomainGroup,
  AssessmentQuestion,
  EvidenceExample,
} from "./types";

/**
 * ISO 27001:2022 — Annex A control catalogue (A.5 to A.8).
 *
 * Each control carries its canonical name/objective/guidance and a set
 * of layered assessment questions. Questions are generated from a
 * per-control blueprint so every control is evaluated against the same
 * depth model (existence → documentation → implementation → effectiveness
 * → review), with evidence expectations tailored per control.
 */

/* -------------------------------------------------------------------- */
/* Blueprint — describes a single control and how to produce its         */
/* layered questions.                                                    */
/* -------------------------------------------------------------------- */

interface ControlBlueprint {
  ref: string; // e.g. "A.5.15"
  name: string;
  domain: AnnexDomain;
  objective: string;
  guidance: string;
  purpose?: string;
  failureIndicators: string[];
  linkedRiskAreas: string[];
  appliesWhen?: string[];
  hideWhen?: string[];
  defaultApplicability?: "applicable" | "not-applicable" | "under-review";
  /** Evidence artefacts that map well to this specific control. */
  evidence: EvidenceExample[];
  /** Optional extra question at the end specific to this control. */
  extraQuestions?: AssessmentQuestion[];
  /** When true the "monitoring" depth question is generated. */
  includeMonitoring?: boolean;
}

const domainName: Record<AnnexDomain, string> = {
  "A.5": "Organisational controls",
  "A.6": "People controls",
  "A.7": "Physical controls",
  "A.8": "Technological controls",
};

/* -------------------------------------------------------------------- */
/* Question factory — builds layered questions for a blueprint.         */
/* -------------------------------------------------------------------- */

function makeQuestions(bp: ControlBlueprint): AssessmentQuestion[] {
  const base = bp.ref.replace(/\./g, "-").toLowerCase();
  const q: AssessmentQuestion[] = [];

  q.push({
    id: `${base}-existence`,
    reference: bp.ref,
    title: `${bp.name} — exists?`,
    text: `Does the organisation have an identified approach to implement ${bp.name} (${bp.ref})?`,
    guidance: bp.guidance,
    whyItMatters: bp.purpose,
    answerType: "yes-no",
    depth: "existence",
    category: "governance",
    weight: 1,
    evidence: bp.evidence.slice(0, 1),
    appliesWhen: bp.appliesWhen,
    hideWhen: bp.hideWhen,
    followUp: { requireJustificationWhenAnswerIn: ["No", "Not applicable"] },
  });

  q.push({
    id: `${base}-policy`,
    reference: bp.ref,
    title: `${bp.name} — documented policy / procedure`,
    text: `Is there a documented policy, standard or procedure that governs ${bp.name} consistent with ISO 27001 ${bp.ref}?`,
    answerType: "implementation-status",
    depth: "documentation",
    category: "policy",
    weight: 2,
    evidence: bp.evidence,
    appliesWhen: bp.appliesWhen,
    hideWhen: bp.hideWhen,
    evidenceRequired: true,
  });

  q.push({
    id: `${base}-implementation`,
    reference: bp.ref,
    title: `${bp.name} — implementation`,
    text: `Is ${bp.name} implemented in practice across the ISMS scope (people, processes, technology)?`,
    answerType: "implementation-status",
    depth: "implementation",
    category: "implementation",
    weight: 3,
    evidence: bp.evidence,
    appliesWhen: bp.appliesWhen,
    hideWhen: bp.hideWhen,
    followUp: { requireJustificationWhenAnswerIn: ["Partially implemented", "Not implemented"] },
  });

  if (bp.includeMonitoring ?? true) {
    q.push({
      id: `${base}-monitoring`,
      reference: bp.ref,
      title: `${bp.name} — monitoring & effectiveness`,
      text: `Is the effectiveness of ${bp.name} monitored, measured and reported (e.g. KPI, alerts, metrics, periodic tests)?`,
      answerType: "maturity",
      depth: "effectiveness",
      category: "monitoring",
      weight: 2,
      evidence: bp.evidence,
      appliesWhen: bp.appliesWhen,
      hideWhen: bp.hideWhen,
      maturityCeilingWithoutReview: 3,
    });
  }

  q.push({
    id: `${base}-review`,
    reference: bp.ref,
    title: `${bp.name} — periodic review`,
    text: `Is ${bp.name} reviewed at planned intervals and after significant changes, with documented outcomes?`,
    answerType: "single-select",
    options: ["At least annually", "Every 2 years", "Ad-hoc / event-driven", "Never documented", "Not applicable"],
    depth: "review",
    category: "review",
    weight: 1,
    evidence: [
      { id: "review-log", label: "Review log / minutes" },
      { id: "version-history", label: "Document version history" },
    ],
    appliesWhen: bp.appliesWhen,
    hideWhen: bp.hideWhen,
  });

  if (bp.extraQuestions?.length) q.push(...bp.extraQuestions);
  return q;
}

/* -------------------------------------------------------------------- */
/* A.5 — Organisational controls (37)                                    */
/* -------------------------------------------------------------------- */

const A5_BLUEPRINTS: ControlBlueprint[] = [
  {
    ref: "A.5.1",
    name: "Policies for information security",
    domain: "A.5",
    objective:
      "To provide management direction and support for information security in accordance with business requirements, laws and regulations.",
    guidance:
      "Approve, publish and communicate a set of information security policies; review at planned intervals and when significant changes occur.",
    purpose: "Without approved policies the entire ISMS lacks authority.",
    failureIndicators: ["No approved policy", "Policy out of date by >2 years", "Low awareness levels"],
    linkedRiskAreas: ["governance", "regulatory"],
    evidence: [
      { id: "policy-suite", label: "Approved information security policy suite", type: "policy" },
      { id: "comms-record", label: "Communication / acknowledgement record" },
    ],
  },
  {
    ref: "A.5.2",
    name: "Information security roles and responsibilities",
    domain: "A.5",
    objective: "To establish a defined, approved and communicated structure for information security.",
    guidance: "Define, allocate, document and communicate roles and responsibilities for information security.",
    failureIndicators: ["Roles undocumented", "Conflicting responsibilities"],
    linkedRiskAreas: ["governance"],
    evidence: [
      { id: "raci", label: "RACI / responsibility matrix" },
      { id: "jd", label: "Job descriptions referencing security" },
    ],
  },
  {
    ref: "A.5.3",
    name: "Segregation of duties",
    domain: "A.5",
    objective: "To reduce the risk of fraud, error and bypass of controls.",
    guidance: "Separate conflicting duties and areas of responsibility to reduce unauthorised modification or misuse of assets.",
    failureIndicators: ["Single individual both requests and approves access", "No SoD matrix"],
    linkedRiskAreas: ["insider", "fraud"],
    evidence: [
      { id: "sod-matrix", label: "SoD matrix / conflict rules" },
      { id: "sod-violations", label: "SoD violations report" },
    ],
  },
  {
    ref: "A.5.4",
    name: "Management responsibilities",
    domain: "A.5",
    objective: "To ensure management requires personnel to apply information security according to established policies.",
    guidance: "Management must explicitly require personnel to apply security in line with the ISMS.",
    failureIndicators: ["No mention of security in onboarding", "Security not in performance reviews"],
    linkedRiskAreas: ["culture"],
    evidence: [
      { id: "onboarding-checklist", label: "Onboarding & security acknowledgement" },
      { id: "perf-criteria", label: "Performance criteria citing security" },
    ],
  },
  {
    ref: "A.5.5",
    name: "Contact with authorities",
    domain: "A.5",
    objective: "To ensure appropriate communication with relevant authorities.",
    guidance: "Maintain contact with relevant regulators and law enforcement for notifications and incidents.",
    failureIndicators: ["No named regulator liaison", "No breach notification playbook"],
    linkedRiskAreas: ["regulatory", "incident"],
    evidence: [
      { id: "auth-contact-list", label: "Authority contact list" },
      { id: "breach-runbook", label: "Regulatory notification runbook" },
    ],
  },
  {
    ref: "A.5.6",
    name: "Contact with special interest groups",
    domain: "A.5",
    objective: "To stay informed about threats, vulnerabilities and good practice.",
    guidance: "Maintain contact with special interest groups, security forums, CERTs.",
    failureIndicators: ["No threat intelligence feeds", "No membership records"],
    linkedRiskAreas: ["threat-intel"],
    evidence: [
      { id: "membership", label: "Memberships (ISAC, FIRST, CERT)" },
      { id: "threat-intel", label: "Threat intelligence feed inventory" },
    ],
  },
  {
    ref: "A.5.7",
    name: "Threat intelligence",
    domain: "A.5",
    objective: "To proactively identify and analyse threats relevant to the organisation.",
    guidance: "Collect, analyse and act on threat intelligence relevant to the organisation's context.",
    failureIndicators: ["No threat-intel process", "Intelligence not actioned"],
    linkedRiskAreas: ["threat-intel", "monitoring"],
    evidence: [
      { id: "ti-program", label: "Threat intelligence programme" },
      { id: "ti-briefings", label: "Threat briefings and action log" },
    ],
  },
  {
    ref: "A.5.8",
    name: "Information security in project management",
    domain: "A.5",
    objective: "To embed information security in project management.",
    guidance: "Integrate security requirements, risk assessment and sign-off gates into project lifecycles.",
    failureIndicators: ["No security gate in projects", "Project risks not tracked centrally"],
    linkedRiskAreas: ["project"],
    evidence: [
      { id: "project-gating", label: "Project gating template with security criteria" },
      { id: "project-risks", label: "Project risk review evidence" },
    ],
  },
  {
    ref: "A.5.9",
    name: "Inventory of information and other associated assets",
    domain: "A.5",
    objective: "To maintain an accurate inventory of information and associated assets.",
    guidance: "Identify, classify and assign ownership for information assets.",
    failureIndicators: ["No asset inventory", "Ownership gaps"],
    linkedRiskAreas: ["asset-management"],
    evidence: [
      { id: "asset-inv", label: "Asset inventory export" },
      { id: "cmdb", label: "Configuration management database record" },
    ],
  },
  {
    ref: "A.5.10",
    name: "Acceptable use of information and other associated assets",
    domain: "A.5",
    objective: "To define acceptable use for information and assets.",
    guidance: "Publish, communicate and enforce acceptable use rules for end-users.",
    failureIndicators: ["No AUP", "No acknowledgement records"],
    linkedRiskAreas: ["insider", "data-leak"],
    evidence: [
      { id: "aup", label: "Acceptable use policy" },
      { id: "aup-ack", label: "Employee acknowledgement records" },
    ],
  },
  {
    ref: "A.5.11",
    name: "Return of assets",
    domain: "A.5",
    objective: "To ensure assets are returned on termination of employment / engagement.",
    guidance: "Process to recover devices, credentials and data from leavers and contractors.",
    failureIndicators: ["No leaver process", "Unaccounted devices post-termination"],
    linkedRiskAreas: ["hr", "insider"],
    evidence: [
      { id: "leaver-checklist", label: "Leaver checklist with asset return confirmation" },
      { id: "asset-reconciliation", label: "Asset recovery reconciliation" },
    ],
  },
  {
    ref: "A.5.12",
    name: "Classification of information",
    domain: "A.5",
    objective: "To ensure information receives an appropriate level of protection.",
    guidance: "Classify information according to legal requirements, value, criticality and sensitivity.",
    failureIndicators: ["No classification scheme", "Classification not applied in practice"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "classification-policy", label: "Information classification policy" },
      { id: "sample-classified", label: "Sample classified artefacts" },
    ],
  },
  {
    ref: "A.5.13",
    name: "Labelling of information",
    domain: "A.5",
    objective: "To ensure consistent labelling aligned with classification.",
    guidance: "Develop and implement procedures for labelling information.",
    failureIndicators: ["Labels missing on sensitive docs", "No labelling tool"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "labelling-tool", label: "Labelling tool configuration" },
      { id: "sample-labels", label: "Sample labelled documents/emails" },
    ],
  },
  {
    ref: "A.5.14",
    name: "Information transfer",
    domain: "A.5",
    objective: "To protect information during transfer inside and outside the organisation.",
    guidance: "Rules, procedures and agreements for information transfer.",
    failureIndicators: ["No transfer rules", "Plaintext transmissions"],
    linkedRiskAreas: ["data-protection", "third-party"],
    evidence: [
      { id: "transfer-policy", label: "Information transfer procedure" },
      { id: "encryption-config", label: "Encryption configuration for transfers" },
    ],
  },
  {
    ref: "A.5.15",
    name: "Access control",
    domain: "A.5",
    objective: "To limit access to information and associated assets.",
    guidance: "Establish, document, approve and review access rules based on business and security requirements.",
    failureIndicators: ["No access control policy", "Over-privileged accounts"],
    linkedRiskAreas: ["access"],
    evidence: [
      { id: "acp", label: "Access control policy" },
      { id: "access-review", label: "Periodic access reviews" },
    ],
  },
  {
    ref: "A.5.16",
    name: "Identity management",
    domain: "A.5",
    objective: "To ensure the full identity lifecycle is managed.",
    guidance: "Manage the full lifecycle of identities: creation, modification, deactivation, deletion.",
    failureIndicators: ["Orphan accounts", "Shared accounts without justification"],
    linkedRiskAreas: ["access"],
    evidence: [
      { id: "iam-policy", label: "Identity lifecycle procedure" },
      { id: "identity-report", label: "Identity reconciliation report" },
    ],
  },
  {
    ref: "A.5.17",
    name: "Authentication information",
    domain: "A.5",
    objective: "To protect authentication information throughout its lifecycle.",
    guidance: "Allocate, manage, protect and replace authentication information securely.",
    failureIndicators: ["Weak password policy", "No MFA for privileged access"],
    linkedRiskAreas: ["access"],
    evidence: [
      { id: "password-policy", label: "Password / MFA policy" },
      { id: "mfa-report", label: "MFA coverage report" },
    ],
  },
  {
    ref: "A.5.18",
    name: "Access rights",
    domain: "A.5",
    objective: "To provision, review, modify and remove access rights aligned with policy.",
    guidance: "Follow a defined access request, approval and revocation process.",
    failureIndicators: ["No approval workflow", "Stale access rights"],
    linkedRiskAreas: ["access"],
    evidence: [
      { id: "access-tickets", label: "Access request tickets with approvals" },
      { id: "revocation-proof", label: "Timely revocation evidence on termination" },
    ],
  },
  {
    ref: "A.5.19",
    name: "Information security in supplier relationships",
    domain: "A.5",
    objective: "To manage information security risks associated with suppliers.",
    guidance: "Agree and document security requirements with suppliers prior to engagement.",
    appliesWhen: ["thirdPartyProcessors", "outsourcedOperations", "usesCloud"],
    failureIndicators: ["No supplier policy", "Security absent from contracts"],
    linkedRiskAreas: ["third-party"],
    evidence: [
      { id: "supplier-policy", label: "Supplier security policy" },
      { id: "contract-clauses", label: "Contractual security clauses" },
    ],
  },
  {
    ref: "A.5.20",
    name: "Addressing information security within supplier agreements",
    domain: "A.5",
    objective: "To ensure security requirements are embedded in supplier contracts.",
    guidance: "Include confidentiality, breach notification, audit rights and data protection clauses.",
    appliesWhen: ["thirdPartyProcessors", "outsourcedOperations"],
    failureIndicators: ["No breach clauses", "No audit rights"],
    linkedRiskAreas: ["third-party"],
    evidence: [
      { id: "template-contract", label: "Template supplier contract" },
      { id: "signed-contracts", label: "Sample signed supplier contracts" },
    ],
  },
  {
    ref: "A.5.21",
    name: "Managing information security in the ICT supply chain",
    domain: "A.5",
    objective: "To manage risks in the ICT supply chain.",
    guidance: "Address risks through the ICT product and service supply chain, including components and sub-processors.",
    appliesWhen: ["thirdPartyProcessors", "usesCloud"],
    failureIndicators: ["No sub-processor inventory", "No SBOM"],
    linkedRiskAreas: ["supply-chain"],
    evidence: [
      { id: "sbom", label: "Software bill of materials (SBOM)" },
      { id: "subprocessor-list", label: "Sub-processor list" },
    ],
  },
  {
    ref: "A.5.22",
    name: "Monitoring, review and change management of supplier services",
    domain: "A.5",
    objective: "To monitor supplier performance and changes to their services.",
    guidance: "Regularly review and audit supplier services; manage service changes.",
    appliesWhen: ["thirdPartyProcessors", "outsourcedOperations"],
    failureIndicators: ["No supplier reviews", "Service changes untracked"],
    linkedRiskAreas: ["third-party"],
    evidence: [
      { id: "supplier-reviews", label: "Supplier review reports" },
      { id: "sla-reports", label: "SLA performance reports" },
    ],
  },
  {
    ref: "A.5.23",
    name: "Information security for use of cloud services",
    domain: "A.5",
    objective: "To acquire, use and exit cloud services securely.",
    guidance: "Define processes for acquisition, use, management and exit from cloud services.",
    appliesWhen: ["usesCloud"],
    failureIndicators: ["No cloud security policy", "No exit plan"],
    linkedRiskAreas: ["cloud", "third-party"],
    evidence: [
      { id: "cloud-policy", label: "Cloud security policy" },
      { id: "cloud-register", label: "Cloud service register" },
      { id: "exit-plan", label: "Cloud exit / portability plan" },
    ],
  },
  {
    ref: "A.5.24",
    name: "Information security incident management planning and preparation",
    domain: "A.5",
    objective: "To prepare for incidents.",
    guidance: "Plan, prepare responsibilities, runbooks and communication plans for incident response.",
    failureIndicators: ["No IR plan", "No named responders"],
    linkedRiskAreas: ["incident"],
    evidence: [
      { id: "ir-plan", label: "Incident response plan" },
      { id: "runbooks", label: "Runbooks for key incident types" },
    ],
  },
  {
    ref: "A.5.25",
    name: "Assessment and decision on information security events",
    domain: "A.5",
    objective: "To triage and classify events into incidents.",
    guidance: "Assess events and decide whether they are incidents.",
    failureIndicators: ["No triage playbook", "High false-negative rate"],
    linkedRiskAreas: ["incident", "monitoring"],
    evidence: [
      { id: "triage-runbook", label: "Triage runbook with severity mapping" },
      { id: "triage-log", label: "Triage decisions log" },
    ],
  },
  {
    ref: "A.5.26",
    name: "Response to information security incidents",
    domain: "A.5",
    objective: "To respond to incidents consistently.",
    guidance: "Respond to incidents per the documented procedure, including containment and recovery.",
    failureIndicators: ["No containment evidence", "Inconsistent handling"],
    linkedRiskAreas: ["incident"],
    evidence: [
      { id: "incident-tickets", label: "Incident tickets with timeline" },
      { id: "comms-templates", label: "Incident communication templates" },
    ],
  },
  {
    ref: "A.5.27",
    name: "Learning from information security incidents",
    domain: "A.5",
    objective: "To reduce the likelihood and impact of future incidents.",
    guidance: "Use knowledge gained from incidents to strengthen controls.",
    failureIndicators: ["No post-incident reviews", "Lessons learnt not tracked to closure"],
    linkedRiskAreas: ["improvement"],
    evidence: [
      { id: "pir", label: "Post-incident review reports" },
      { id: "actions-register", label: "Lessons-learnt action register" },
    ],
  },
  {
    ref: "A.5.28",
    name: "Collection of evidence",
    domain: "A.5",
    objective: "To ensure evidence is collected and preserved properly.",
    guidance: "Identify, collect and preserve evidence in a forensically sound manner.",
    failureIndicators: ["No chain of custody", "Evidence not preserved"],
    linkedRiskAreas: ["legal", "incident"],
    evidence: [
      { id: "forensics-sop", label: "Forensic evidence handling SOP" },
      { id: "sample-chain", label: "Sample chain of custody form" },
    ],
  },
  {
    ref: "A.5.29",
    name: "Information security during disruption",
    domain: "A.5",
    objective: "To maintain information security during disruption.",
    guidance: "Ensure the security baseline is maintained during and after disruptions.",
    failureIndicators: ["Disaster recovery weakens security", "No BC/DR tests from a security angle"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "bc-plan", label: "BC / DR plans with security controls" },
      { id: "bc-test", label: "BC / DR test reports" },
    ],
  },
  {
    ref: "A.5.30",
    name: "ICT readiness for business continuity",
    domain: "A.5",
    objective: "To ensure ICT supports business continuity requirements.",
    guidance: "Align ICT continuity plans with business impact analyses (BIA).",
    failureIndicators: ["No BIA", "No RTO/RPO targets"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "bia", label: "Business impact analysis" },
      { id: "ict-bc-plan", label: "ICT continuity plan" },
    ],
  },
  {
    ref: "A.5.31",
    name: "Legal, statutory, regulatory and contractual requirements",
    domain: "A.5",
    objective: "To meet all legal, statutory, regulatory and contractual obligations.",
    guidance: "Identify obligations, plan compliance and keep the register current.",
    failureIndicators: ["Register outdated", "Obligations uncovered"],
    linkedRiskAreas: ["regulatory"],
    evidence: [
      { id: "obligations-register", label: "Obligations register" },
      { id: "legal-review", label: "Legal review sign-off" },
    ],
  },
  {
    ref: "A.5.32",
    name: "Intellectual property rights",
    domain: "A.5",
    objective: "To protect IP rights.",
    guidance: "Implement procedures to protect IP.",
    failureIndicators: ["No software asset management", "Unlicensed software"],
    linkedRiskAreas: ["legal"],
    evidence: [
      { id: "sam-report", label: "Software asset management report" },
      { id: "ip-policy", label: "IP / licensing policy" },
    ],
  },
  {
    ref: "A.5.33",
    name: "Protection of records",
    domain: "A.5",
    objective: "To protect records from loss, destruction, falsification, unauthorised access.",
    guidance: "Retain, protect and dispose of records per legal and business requirements.",
    failureIndicators: ["No retention schedule", "Records accessible to unauthorised staff"],
    linkedRiskAreas: ["records", "regulatory"],
    evidence: [
      { id: "retention-schedule", label: "Records retention schedule" },
      { id: "records-access", label: "Access controls on records" },
    ],
  },
  {
    ref: "A.5.34",
    name: "Privacy and protection of PII",
    domain: "A.5",
    objective: "To protect personal information (PII) as required.",
    guidance: "Implement privacy-by-design and legal basis for processing PII.",
    appliesWhen: ["handlesPii"],
    failureIndicators: ["No DPIA", "No legal basis records"],
    linkedRiskAreas: ["privacy", "regulatory"],
    evidence: [
      { id: "privacy-policy", label: "Privacy policy / notice" },
      { id: "dpia", label: "Sample DPIA" },
      { id: "ropa", label: "Record of processing activities (ROPA)" },
    ],
  },
  {
    ref: "A.5.35",
    name: "Independent review of information security",
    domain: "A.5",
    objective: "To obtain independent reviews of the ISMS.",
    guidance: "Plan and perform independent reviews at planned intervals and on major changes.",
    failureIndicators: ["No independent review", "Reviews by own team only"],
    linkedRiskAreas: ["assurance"],
    evidence: [
      { id: "ir-reports", label: "Independent review reports" },
      { id: "ir-scope", label: "Terms of reference for reviews" },
    ],
  },
  {
    ref: "A.5.36",
    name: "Compliance with policies, rules and standards for information security",
    domain: "A.5",
    objective: "To ensure compliance with internal policies and standards.",
    guidance: "Regularly review whether practice matches policy.",
    failureIndicators: ["No policy compliance reviews", "Open findings ignored"],
    linkedRiskAreas: ["assurance"],
    evidence: [
      { id: "compliance-audits", label: "Policy compliance audit reports" },
      { id: "findings-register", label: "Findings register with status" },
    ],
  },
  {
    ref: "A.5.37",
    name: "Documented operating procedures",
    domain: "A.5",
    objective: "To document operating procedures for ICT and security.",
    guidance: "Document procedures and make them available to all users who need them.",
    failureIndicators: ["Runbooks missing", "Tribal knowledge"],
    linkedRiskAreas: ["operations"],
    evidence: [
      { id: "sop-library", label: "SOP / runbook library" },
      { id: "procedure-versions", label: "Version history" },
    ],
  },
];

/* -------------------------------------------------------------------- */
/* A.6 — People controls (8)                                             */
/* -------------------------------------------------------------------- */

const A6_BLUEPRINTS: ControlBlueprint[] = [
  {
    ref: "A.6.1",
    name: "Screening",
    domain: "A.6",
    objective: "To verify the background of candidates before employment.",
    guidance: "Conduct background verification proportionate to role sensitivity and legal requirements.",
    failureIndicators: ["No screening for privileged roles", "No evidence of checks"],
    linkedRiskAreas: ["hr", "insider"],
    evidence: [
      { id: "screening-policy", label: "Screening policy" },
      { id: "screening-records", label: "Completed screening records" },
    ],
  },
  {
    ref: "A.6.2",
    name: "Terms and conditions of employment",
    domain: "A.6",
    objective: "To define information security responsibilities in contracts.",
    guidance: "Include security responsibilities and confidentiality terms in employment / contractor agreements.",
    failureIndicators: ["No security clauses", "Old templates in use"],
    linkedRiskAreas: ["hr", "legal"],
    evidence: [
      { id: "contract-template", label: "Employment contract template" },
      { id: "confidentiality", label: "Signed confidentiality clauses" },
    ],
  },
  {
    ref: "A.6.3",
    name: "Information security awareness, education and training",
    domain: "A.6",
    objective: "To maintain awareness and skills across the workforce.",
    guidance: "Run awareness training for all personnel and specialist training for security roles.",
    failureIndicators: ["Low completion rates", "No role-based training"],
    linkedRiskAreas: ["culture", "awareness"],
    evidence: [
      { id: "awareness-plan", label: "Awareness programme plan" },
      { id: "completion-report", label: "Training completion report" },
      { id: "phishing-metrics", label: "Phishing simulation metrics" },
    ],
  },
  {
    ref: "A.6.4",
    name: "Disciplinary process",
    domain: "A.6",
    objective: "To enforce consequences for security violations.",
    guidance: "Formal disciplinary process for personnel who have committed security breaches.",
    failureIndicators: ["No documented process", "Inconsistent enforcement"],
    linkedRiskAreas: ["hr", "culture"],
    evidence: [
      { id: "disciplinary-policy", label: "Disciplinary policy covering security" },
      { id: "action-log", label: "Disciplinary actions log" },
    ],
  },
  {
    ref: "A.6.5",
    name: "Responsibilities after termination or change of employment",
    domain: "A.6",
    objective: "To manage responsibilities after leavers / movers.",
    guidance: "Communicate and enforce continuing security obligations post-termination.",
    failureIndicators: ["No exit briefing", "Ongoing confidentiality not reinforced"],
    linkedRiskAreas: ["hr", "insider"],
    evidence: [
      { id: "exit-interview", label: "Exit interview security checklist" },
      { id: "leaver-process", label: "Leaver process documentation" },
    ],
  },
  {
    ref: "A.6.6",
    name: "Confidentiality or non-disclosure agreements",
    domain: "A.6",
    objective: "To legally protect confidential information.",
    guidance: "Identify, document and regularly review confidentiality / NDA requirements.",
    failureIndicators: ["No NDAs for contractors", "NDAs not reviewed"],
    linkedRiskAreas: ["legal"],
    evidence: [
      { id: "nda-templates", label: "NDA / confidentiality templates" },
      { id: "nda-register", label: "NDA register" },
    ],
  },
  {
    ref: "A.6.7",
    name: "Remote working",
    domain: "A.6",
    objective: "To protect information accessed outside office premises.",
    guidance: "Define policy, technical controls and training for remote working.",
    appliesWhen: ["remoteWorkers"],
    failureIndicators: ["No remote working policy", "No endpoint controls for remote workers"],
    linkedRiskAreas: ["remote-work", "endpoint"],
    evidence: [
      { id: "remote-policy", label: "Remote working policy" },
      { id: "vpn-config", label: "VPN / ZTNA configuration" },
      { id: "endpoint-report", label: "Endpoint compliance report" },
    ],
  },
  {
    ref: "A.6.8",
    name: "Information security event reporting",
    domain: "A.6",
    objective: "To enable personnel to report suspected events.",
    guidance: "Provide an easy and well-publicised mechanism for reporting security events.",
    failureIndicators: ["No reporting channel", "Reports not acknowledged"],
    linkedRiskAreas: ["incident", "awareness"],
    evidence: [
      { id: "reporting-channel", label: "Event reporting channel (email / portal)" },
      { id: "awareness-comms", label: "Awareness material covering reporting" },
    ],
  },
];

/* -------------------------------------------------------------------- */
/* A.7 — Physical controls (14)                                          */
/* -------------------------------------------------------------------- */

const A7_BLUEPRINTS: ControlBlueprint[] = [
  {
    ref: "A.7.1",
    name: "Physical security perimeters",
    domain: "A.7",
    objective: "To protect facilities that process information.",
    guidance: "Define and protect perimeters of areas containing information and assets.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No perimeter definition", "Unrestricted access to facilities"],
    linkedRiskAreas: ["physical"],
    evidence: [
      { id: "facility-diagram", label: "Facility / zoning diagram" },
      { id: "perimeter-controls", label: "Perimeter control design" },
    ],
  },
  {
    ref: "A.7.2",
    name: "Physical entry",
    domain: "A.7",
    objective: "To restrict physical entry to authorised personnel.",
    guidance: "Physical access control points for secure areas.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No access control system", "Tail-gating unchecked"],
    linkedRiskAreas: ["physical"],
    evidence: [
      { id: "badge-logs", label: "Badge access logs" },
      { id: "visitor-log", label: "Visitor log" },
    ],
  },
  {
    ref: "A.7.3",
    name: "Securing offices, rooms and facilities",
    domain: "A.7",
    objective: "To protect offices and rooms containing sensitive information.",
    guidance: "Lock rooms, windows and cabinets containing sensitive information.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No locking controls for server rooms"],
    linkedRiskAreas: ["physical"],
    evidence: [
      { id: "walkthrough", label: "Facility walkthrough report" },
      { id: "locking-standard", label: "Locking / secure-room standard" },
    ],
  },
  {
    ref: "A.7.4",
    name: "Physical security monitoring",
    domain: "A.7",
    objective: "To monitor facilities for unauthorised access.",
    guidance: "Deploy CCTV, alarms, guard patrols aligned with risk.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No CCTV", "No alarm system"],
    linkedRiskAreas: ["physical"],
    evidence: [
      { id: "cctv-coverage", label: "CCTV coverage plan" },
      { id: "alarm-tests", label: "Alarm test logs" },
    ],
  },
  {
    ref: "A.7.5",
    name: "Protecting against physical and environmental threats",
    domain: "A.7",
    objective: "To protect against fire, flood, earthquake and other environmental threats.",
    guidance: "Assess and mitigate environmental and physical threats.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No fire suppression in server rooms", "No environmental monitoring"],
    linkedRiskAreas: ["physical", "resilience"],
    evidence: [
      { id: "env-monitor", label: "Environmental monitoring dashboards" },
      { id: "fire-cert", label: "Fire suppression certifications" },
    ],
  },
  {
    ref: "A.7.6",
    name: "Working in secure areas",
    domain: "A.7",
    objective: "To define rules for working in secure areas.",
    guidance: "Rules for working in secure areas, including photography bans and device restrictions.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No rules defined", "No signage"],
    linkedRiskAreas: ["physical"],
    evidence: [{ id: "secure-area-rules", label: "Secure-area rules / signage" }],
  },
  {
    ref: "A.7.7",
    name: "Clear desk and clear screen",
    domain: "A.7",
    objective: "To protect information left unattended.",
    guidance: "Enforce clear-desk and clear-screen rules via policy and automated controls.",
    failureIndicators: ["No CDCS policy", "Screens not auto-locked"],
    linkedRiskAreas: ["physical", "insider"],
    evidence: [
      { id: "cdcs-policy", label: "Clear desk / clear screen policy" },
      { id: "screensaver-gpo", label: "Screensaver lockout configuration" },
    ],
  },
  {
    ref: "A.7.8",
    name: "Equipment siting and protection",
    domain: "A.7",
    objective: "To protect equipment from physical and environmental threats.",
    guidance: "Locate equipment where it is protected and monitor environmental conditions.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["Poor siting near windows", "No environmental monitoring"],
    linkedRiskAreas: ["physical"],
    evidence: [
      { id: "siting-standard", label: "Siting standard for critical equipment" },
      { id: "env-sensors", label: "Environmental sensor readings" },
    ],
  },
  {
    ref: "A.7.9",
    name: "Security of assets off-premises",
    domain: "A.7",
    objective: "To protect assets outside the office.",
    guidance: "Apply protection to devices taken off premises.",
    failureIndicators: ["Unencrypted laptops", "No device tracking"],
    linkedRiskAreas: ["remote-work", "endpoint"],
    evidence: [
      { id: "mobile-policy", label: "Mobile / off-premises policy" },
      { id: "encryption-report", label: "Device encryption coverage report" },
    ],
  },
  {
    ref: "A.7.10",
    name: "Storage media",
    domain: "A.7",
    objective: "To protect information on storage media.",
    guidance: "Control lifecycle of storage media including disposal.",
    failureIndicators: ["Uncontrolled USB use", "No disposal certificates"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "media-policy", label: "Storage media policy" },
      { id: "disposal-records", label: "Disposal / destruction certificates" },
    ],
  },
  {
    ref: "A.7.11",
    name: "Supporting utilities",
    domain: "A.7",
    objective: "To protect against failure of utilities.",
    guidance: "Protect against power failures, HVAC, water etc.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["No UPS", "Single utility source"],
    linkedRiskAreas: ["resilience", "physical"],
    evidence: [
      { id: "ups-report", label: "UPS / generator test reports" },
      { id: "hvac-log", label: "HVAC monitoring log" },
    ],
  },
  {
    ref: "A.7.12",
    name: "Cabling security",
    domain: "A.7",
    objective: "To protect power and data cabling.",
    guidance: "Protect cabling carrying power or data from interception or damage.",
    hideWhen: ["!hasPhysicalOffice"],
    failureIndicators: ["Exposed cabling", "No segregation"],
    linkedRiskAreas: ["physical"],
    evidence: [{ id: "cable-standard", label: "Cabling standard / audit report" }],
  },
  {
    ref: "A.7.13",
    name: "Equipment maintenance",
    domain: "A.7",
    objective: "To maintain equipment to ensure continued availability.",
    guidance: "Schedule and record equipment maintenance.",
    failureIndicators: ["No maintenance schedule", "Unplanned outages"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "maintenance-schedule", label: "Maintenance schedule" },
      { id: "maintenance-records", label: "Completed maintenance records" },
    ],
  },
  {
    ref: "A.7.14",
    name: "Secure disposal or re-use of equipment",
    domain: "A.7",
    objective: "To ensure data is removed before disposal or re-use.",
    guidance: "Verify secure erasure or destruction before disposal or re-use.",
    failureIndicators: ["No disposal certificates", "No data sanitisation"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "disposal-procedure", label: "Secure disposal procedure" },
      { id: "certificates", label: "Destruction certificates" },
    ],
  },
];

/* -------------------------------------------------------------------- */
/* A.8 — Technological controls (34)                                     */
/* -------------------------------------------------------------------- */

const A8_BLUEPRINTS: ControlBlueprint[] = [
  {
    ref: "A.8.1",
    name: "User end point devices",
    domain: "A.8",
    objective: "To secure user endpoints.",
    guidance: "Protect information on end-user devices through technical and procedural controls.",
    failureIndicators: ["No MDM", "No disk encryption", "Stale endpoints"],
    linkedRiskAreas: ["endpoint"],
    evidence: [
      { id: "mdm-config", label: "MDM / UEM configuration" },
      { id: "encryption-report", label: "Endpoint encryption report" },
    ],
  },
  {
    ref: "A.8.2",
    name: "Privileged access rights",
    domain: "A.8",
    objective: "To restrict and control privileged access.",
    guidance: "Allocate, review and monitor privileged access with extra safeguards.",
    failureIndicators: ["Standing privileged access", "No PAM solution"],
    linkedRiskAreas: ["access", "insider"],
    evidence: [
      { id: "pam", label: "PAM configuration / session logs" },
      { id: "priv-review", label: "Privileged access reviews" },
    ],
  },
  {
    ref: "A.8.3",
    name: "Information access restriction",
    domain: "A.8",
    objective: "To restrict access based on business need and classification.",
    guidance: "Restrict access in accordance with topic-specific access policy.",
    failureIndicators: ["Over-permissive shares", "No role-based access"],
    linkedRiskAreas: ["access", "data-protection"],
    evidence: [
      { id: "rbac-matrix", label: "Role-based access matrix" },
      { id: "share-audit", label: "File share audit" },
    ],
  },
  {
    ref: "A.8.4",
    name: "Access to source code",
    domain: "A.8",
    objective: "To restrict access to source code.",
    guidance: "Manage read/write access to source code, development tools and libraries.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["Anonymous access to repos", "No branch protection"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "repo-acls", label: "Repository access controls" },
      { id: "branch-protection", label: "Branch protection rules" },
    ],
  },
  {
    ref: "A.8.5",
    name: "Secure authentication",
    domain: "A.8",
    objective: "To ensure only authorised users access systems.",
    guidance: "Implement strong authentication (MFA, SSO, adaptive) per sensitivity.",
    failureIndicators: ["No MFA on admin", "Weak password reuse"],
    linkedRiskAreas: ["access"],
    evidence: [
      { id: "mfa-policy", label: "MFA policy and coverage reports" },
      { id: "sso-config", label: "SSO configuration" },
    ],
  },
  {
    ref: "A.8.6",
    name: "Capacity management",
    domain: "A.8",
    objective: "To ensure capacity meets demand.",
    guidance: "Monitor and forecast capacity of resources.",
    failureIndicators: ["No capacity planning", "Frequent outages"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "capacity-plan", label: "Capacity plan / forecasts" },
      { id: "monitoring-dashboards", label: "Performance dashboards" },
    ],
  },
  {
    ref: "A.8.7",
    name: "Protection against malware",
    domain: "A.8",
    objective: "To protect systems against malware.",
    guidance: "Implement detection, prevention and recovery controls against malware, combined with awareness.",
    failureIndicators: ["No EDR", "Outdated signatures"],
    linkedRiskAreas: ["endpoint", "threat"],
    evidence: [
      { id: "edr-config", label: "EDR / AV configuration and coverage" },
      { id: "malware-alerts", label: "Sample alerts and triage" },
    ],
  },
  {
    ref: "A.8.8",
    name: "Management of technical vulnerabilities",
    domain: "A.8",
    objective: "To prevent exploitation of vulnerabilities.",
    guidance: "Identify, evaluate and remediate vulnerabilities in a timely fashion.",
    failureIndicators: ["No SLA for patching", "Old unpatched systems"],
    linkedRiskAreas: ["vulnerability"],
    evidence: [
      { id: "vuln-scans", label: "Vulnerability scan reports" },
      { id: "patch-sla", label: "Patch SLA and dashboards" },
    ],
  },
  {
    ref: "A.8.9",
    name: "Configuration management",
    domain: "A.8",
    objective: "To establish and maintain secure configurations.",
    guidance: "Establish, document, implement, monitor and review secure configurations.",
    failureIndicators: ["No secure baselines", "Drift untracked"],
    linkedRiskAreas: ["configuration"],
    evidence: [
      { id: "baselines", label: "Secure baseline library (CIS etc.)" },
      { id: "drift-reports", label: "Drift / compliance reports" },
    ],
  },
  {
    ref: "A.8.10",
    name: "Information deletion",
    domain: "A.8",
    objective: "To delete information when no longer required.",
    guidance: "Delete or anonymise information per retention rules and legal requirements.",
    failureIndicators: ["Data kept forever", "No deletion evidence"],
    linkedRiskAreas: ["data-protection", "privacy"],
    evidence: [
      { id: "retention-schedule", label: "Retention schedule" },
      { id: "deletion-records", label: "Deletion job logs / certificates" },
    ],
  },
  {
    ref: "A.8.11",
    name: "Data masking",
    domain: "A.8",
    objective: "To protect sensitive data by masking.",
    guidance: "Use data masking, tokenisation or pseudonymisation for sensitive data.",
    appliesWhen: ["handlesPii", "handlesPayments"],
    failureIndicators: ["Production data in test environments"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "masking-config", label: "Masking / tokenisation configuration" },
      { id: "test-env-policy", label: "Test environment data policy" },
    ],
  },
  {
    ref: "A.8.12",
    name: "Data leakage prevention",
    domain: "A.8",
    objective: "To prevent unauthorised disclosure of information.",
    guidance: "Deploy DLP for sensitive data in use, in transit and at rest.",
    failureIndicators: ["No DLP", "Unchecked exfil channels"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "dlp-rules", label: "DLP ruleset and scope" },
      { id: "dlp-alerts", label: "DLP incident trends" },
    ],
  },
  {
    ref: "A.8.13",
    name: "Information backup",
    domain: "A.8",
    objective: "To protect against loss of information.",
    guidance: "Maintain adequate backups; protect and regularly test them.",
    failureIndicators: ["No backup testing", "No off-site or immutable copies"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "backup-policy", label: "Backup policy and schedule" },
      { id: "restore-tests", label: "Restore test evidence" },
    ],
  },
  {
    ref: "A.8.14",
    name: "Redundancy of information processing facilities",
    domain: "A.8",
    objective: "To meet availability requirements through redundancy.",
    guidance: "Provide redundancy of information processing facilities as required.",
    failureIndicators: ["Single points of failure", "No redundancy tests"],
    linkedRiskAreas: ["resilience"],
    evidence: [
      { id: "ha-design", label: "HA / DR architecture" },
      { id: "failover-test", label: "Failover test reports" },
    ],
  },
  {
    ref: "A.8.15",
    name: "Logging",
    domain: "A.8",
    objective: "To record events to support monitoring and investigation.",
    guidance: "Record events, generate evidence and protect logs.",
    failureIndicators: ["No central log collection", "Short retention"],
    linkedRiskAreas: ["monitoring", "incident"],
    evidence: [
      { id: "logging-policy", label: "Logging policy / log sources list" },
      { id: "siem-config", label: "SIEM configuration" },
    ],
  },
  {
    ref: "A.8.16",
    name: "Monitoring activities",
    domain: "A.8",
    objective: "To detect anomalous behaviour and potential incidents.",
    guidance: "Monitor systems, networks and applications for anomalous behaviour.",
    failureIndicators: ["No SOC / MSSP", "Alerts unactioned"],
    linkedRiskAreas: ["monitoring"],
    evidence: [
      { id: "soc-runbooks", label: "SOC runbooks / alerting catalogue" },
      { id: "soc-metrics", label: "Monitoring KPIs (MTTD / MTTR)" },
    ],
  },
  {
    ref: "A.8.17",
    name: "Clock synchronisation",
    domain: "A.8",
    objective: "To ensure accurate timestamps.",
    guidance: "Synchronise clocks to trusted sources.",
    failureIndicators: ["Hosts not NTP-synced", "Drift between logs"],
    linkedRiskAreas: ["monitoring"],
    evidence: [
      { id: "ntp-config", label: "NTP configuration" },
      { id: "ntp-report", label: "Clock-sync compliance report" },
    ],
  },
  {
    ref: "A.8.18",
    name: "Use of privileged utility programs",
    domain: "A.8",
    objective: "To restrict privileged utilities.",
    guidance: "Restrict and monitor the use of privileged utility programs.",
    failureIndicators: ["Unrestricted admin tools on endpoints", "No monitoring"],
    linkedRiskAreas: ["access", "endpoint"],
    evidence: [
      { id: "utility-list", label: "Approved privileged utility list" },
      { id: "utility-monitoring", label: "Monitoring / alerts on use" },
    ],
  },
  {
    ref: "A.8.19",
    name: "Installation of software on operational systems",
    domain: "A.8",
    objective: "To manage software installation on operational systems.",
    guidance: "Control which software can be installed.",
    failureIndicators: ["Users can install anything", "No approved software catalogue"],
    linkedRiskAreas: ["endpoint", "configuration"],
    evidence: [
      { id: "software-catalog", label: "Approved software catalogue" },
      { id: "app-allowlist", label: "Application allow-list configuration" },
    ],
  },
  {
    ref: "A.8.20",
    name: "Networks security",
    domain: "A.8",
    objective: "To protect networks and infrastructure.",
    guidance: "Manage and control networks to protect information in systems and applications.",
    failureIndicators: ["Flat network", "No network monitoring"],
    linkedRiskAreas: ["network"],
    evidence: [
      { id: "network-diagram", label: "Network diagram with segmentation" },
      { id: "firewall-reviews", label: "Firewall rule reviews" },
    ],
  },
  {
    ref: "A.8.21",
    name: "Security of network services",
    domain: "A.8",
    objective: "To define and enforce security of network services.",
    guidance: "Identify, implement and monitor security mechanisms and SLAs for network services.",
    failureIndicators: ["Unvetted network services", "No SLAs"],
    linkedRiskAreas: ["network"],
    evidence: [
      { id: "network-sla", label: "Network service SLAs" },
      { id: "service-inventory", label: "Network services inventory" },
    ],
  },
  {
    ref: "A.8.22",
    name: "Segregation of networks",
    domain: "A.8",
    objective: "To segregate groups of information services and users.",
    guidance: "Segregate networks based on trust level and sensitivity.",
    failureIndicators: ["No VLANs", "Flat production network"],
    linkedRiskAreas: ["network"],
    evidence: [
      { id: "segmentation-design", label: "Segmentation design" },
      { id: "policy-rules", label: "Network access rules" },
    ],
  },
  {
    ref: "A.8.23",
    name: "Web filtering",
    domain: "A.8",
    objective: "To reduce exposure to malicious websites.",
    guidance: "Manage access to external websites.",
    failureIndicators: ["No web filtering", "No category policy"],
    linkedRiskAreas: ["endpoint", "threat"],
    evidence: [
      { id: "web-proxy", label: "Web proxy / secure gateway configuration" },
      { id: "category-policy", label: "Category filtering policy" },
    ],
  },
  {
    ref: "A.8.24",
    name: "Use of cryptography",
    domain: "A.8",
    objective: "To protect information using cryptography.",
    guidance: "Define and implement cryptographic controls and key management.",
    failureIndicators: ["No crypto policy", "Hardcoded keys"],
    linkedRiskAreas: ["data-protection"],
    evidence: [
      { id: "crypto-policy", label: "Cryptographic policy" },
      { id: "kms-config", label: "KMS / HSM configuration" },
    ],
  },
  {
    ref: "A.8.25",
    name: "Secure development life cycle",
    domain: "A.8",
    objective: "To embed security in development.",
    guidance: "Rules for secure development of software and systems.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["No SSDLC", "No secure design reviews"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "ssdlc", label: "Secure development lifecycle policy" },
      { id: "design-review", label: "Sample secure design review" },
    ],
  },
  {
    ref: "A.8.26",
    name: "Application security requirements",
    domain: "A.8",
    objective: "To ensure application security requirements are defined and met.",
    guidance: "Identify, specify and approve application security requirements.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["No security user stories", "Requirements skipped"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "security-requirements", label: "Security requirements catalogue" },
      { id: "req-signoff", label: "Requirement approvals" },
    ],
  },
  {
    ref: "A.8.27",
    name: "Secure system architecture and engineering principles",
    domain: "A.8",
    objective: "To apply secure engineering principles.",
    guidance: "Apply principles of secure engineering across projects.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["No reference architectures", "Threat modelling absent"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "reference-arch", label: "Reference / zero-trust architectures" },
      { id: "threat-models", label: "Threat models" },
    ],
  },
  {
    ref: "A.8.28",
    name: "Secure coding",
    domain: "A.8",
    objective: "To enforce secure coding practices.",
    guidance: "Apply secure coding standards supported by training and tooling.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["No static analysis", "No peer review"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "sast-config", label: "SAST tool configuration" },
      { id: "coding-standard", label: "Secure coding standards" },
    ],
  },
  {
    ref: "A.8.29",
    name: "Security testing in development and acceptance",
    domain: "A.8",
    objective: "To verify security requirements are met before release.",
    guidance: "Define, execute and evidence security testing in each release.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["No release-level security tests", "No pen-test program"],
    linkedRiskAreas: ["development"],
    evidence: [
      { id: "pentest-reports", label: "Penetration test reports" },
      { id: "release-tests", label: "Release testing gates" },
    ],
  },
  {
    ref: "A.8.30",
    name: "Outsourced development",
    domain: "A.8",
    objective: "To ensure outsourced development meets security requirements.",
    guidance: "Direct, monitor and review outsourced development activity.",
    appliesWhen: ["developsSoftware", "outsourcedOperations"],
    failureIndicators: ["No oversight of outsourced dev", "No security clauses"],
    linkedRiskAreas: ["development", "third-party"],
    evidence: [
      { id: "vendor-requirements", label: "Outsourced development security clauses" },
      { id: "vendor-qa", label: "Vendor QA / review reports" },
    ],
  },
  {
    ref: "A.8.31",
    name: "Separation of development, test and production environments",
    domain: "A.8",
    objective: "To reduce risks of unauthorised access and changes.",
    guidance: "Separate development, test and production environments.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["Shared environments", "Production data in dev/test"],
    linkedRiskAreas: ["development", "data-protection"],
    evidence: [
      { id: "env-topology", label: "Environment topology diagram" },
      { id: "access-segregation", label: "Access segregation evidence" },
    ],
  },
  {
    ref: "A.8.32",
    name: "Change management",
    domain: "A.8",
    objective: "To control changes to information processing facilities.",
    guidance: "Formal change management with approvals, testing and back-out plans.",
    failureIndicators: ["Unapproved changes", "No change log"],
    linkedRiskAreas: ["operations", "configuration"],
    evidence: [
      { id: "change-procedure", label: "Change management procedure" },
      { id: "change-tickets", label: "Sample change tickets" },
    ],
  },
  {
    ref: "A.8.33",
    name: "Test information",
    domain: "A.8",
    objective: "To protect information used for testing.",
    guidance: "Use carefully selected, protected test information.",
    appliesWhen: ["developsSoftware"],
    failureIndicators: ["Live PII in test", "No masking"],
    linkedRiskAreas: ["data-protection", "development"],
    evidence: [
      { id: "test-data-policy", label: "Test data management policy" },
      { id: "masking-evidence", label: "Masking / synthetic data evidence" },
    ],
  },
  {
    ref: "A.8.34",
    name: "Protection of information systems during audit testing",
    domain: "A.8",
    objective: "To minimise disruption from audit tests.",
    guidance: "Plan and control audit tests to avoid disruption.",
    failureIndicators: ["Ad-hoc audit activity causing outage"],
    linkedRiskAreas: ["operations", "assurance"],
    evidence: [
      { id: "audit-test-plan", label: "Agreed audit testing plan" },
      { id: "audit-change-log", label: "Audit activity change records" },
    ],
  },
];

/* -------------------------------------------------------------------- */
/* Build the final catalogue                                             */
/* -------------------------------------------------------------------- */

function blueprintToControl(bp: ControlBlueprint): AnnexControl {
  return {
    id: bp.ref.toLowerCase().replace(/\./g, "-"),
    reference: bp.ref,
    name: bp.name,
    domain: bp.domain,
    domainName: domainName[bp.domain],
    objective: bp.objective,
    guidance: bp.guidance,
    purpose: bp.purpose,
    failureIndicators: bp.failureIndicators,
    linkedRiskAreas: bp.linkedRiskAreas,
    appliesWhen: bp.appliesWhen,
    hideWhen: bp.hideWhen,
    defaultApplicability: bp.defaultApplicability ?? "applicable",
    questions: makeQuestions(bp),
  };
}

const A5_CONTROLS = A5_BLUEPRINTS.map(blueprintToControl);
const A6_CONTROLS = A6_BLUEPRINTS.map(blueprintToControl);
const A7_CONTROLS = A7_BLUEPRINTS.map(blueprintToControl);
const A8_CONTROLS = A8_BLUEPRINTS.map(blueprintToControl);

export const ANNEX_A: AnnexDomainGroup[] = [
  {
    domain: "A.5",
    name: "Organisational controls",
    description:
      "Governance-level controls: policies, roles, supplier management, incident management, compliance and classification.",
    controls: A5_CONTROLS,
  },
  {
    domain: "A.6",
    name: "People controls",
    description: "Controls associated with employees and contractors throughout the employment lifecycle.",
    controls: A6_CONTROLS,
  },
  {
    domain: "A.7",
    name: "Physical controls",
    description: "Controls that protect the physical environment — facilities, equipment and media.",
    controls: A7_CONTROLS,
  },
  {
    domain: "A.8",
    name: "Technological controls",
    description: "Controls that apply to technology — networks, endpoints, applications, cryptography, monitoring.",
    controls: A8_CONTROLS,
  },
];

export function getAllAnnexQuestions(): AssessmentQuestion[] {
  return ANNEX_A.flatMap((g) => g.controls.flatMap((c) => c.questions));
}

export function getAnnexControl(ref: string): AnnexControl | undefined {
  for (const group of ANNEX_A) {
    const match = group.controls.find((c) => c.reference === ref);
    if (match) return match;
  }
  return undefined;
}

export function getAnnexControls(): AnnexControl[] {
  return ANNEX_A.flatMap((g) => g.controls);
}
