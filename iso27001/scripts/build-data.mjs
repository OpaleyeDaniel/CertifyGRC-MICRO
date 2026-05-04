/**
 * Regenerates data/clauses.json, data/annex_a.json, and output/iso27001_full_question_list.txt
 * Run: node scripts/build-data.mjs (from iso27001/)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ANNEX_CONTROLS = [
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.1", title: "Policies for information security" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.2", title: "Information security roles and responsibilities" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.3", title: "Segregation of duties" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.4", title: "Management responsibilities" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.5", title: "Contact with authorities" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.6", title: "Contact with special interest groups" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.7", title: "Threat intelligence" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.8", title: "Information security in project management" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.9", title: "Inventory of information and other associated assets" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.10", title: "Acceptable use of information and other associated assets" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.11", title: "Return of assets" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.12", title: "Classification of information" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.13", title: "Labelling of information" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.14", title: "Information transfer" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.15", title: "Access control" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.16", title: "Identity management" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.17", title: "Authentication information" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.18", title: "Access rights" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.19", title: "Information security in supplier relationships" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.20", title: "Addressing information security within supplier agreements" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.21", title: "Managing information security in the ICT supply chain" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.22", title: "Monitoring, review and change management of supplier services" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.23", title: "Information security for use of cloud services" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.24", title: "Information security incident management planning and preparation" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.25", title: "Assessment and decision on information security events" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.26", title: "Response to information security incidents" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.27", title: "Learning from information security incidents" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.28", title: "Collection of evidence" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.29", title: "Information security during disruption" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.30", title: "ICT readiness for business continuity" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.31", title: "Identification of legal, statutory, regulatory and contractual requirements" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.32", title: "Intellectual property rights" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.33", title: "Protection of records" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.34", title: "Privacy and protection of PII" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.35", title: "Independent review of information security" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.36", title: "Compliance with policies, rules and standards for information security" },
  { theme: "A.5", themeTitle: "Organisational controls", ref: "A.5.37", title: "Documented operating procedures" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.1", title: "Screening" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.2", title: "Terms and conditions of employment" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.3", title: "Information security awareness, education and training" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.4", title: "Disciplinary process" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.5", title: "Responsibilities after termination or change of employment" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.6", title: "Confidentiality or non-disclosure agreements" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.7", title: "Remote working" },
  { theme: "A.6", themeTitle: "People controls", ref: "A.6.8", title: "Information security event reporting" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.1", title: "Physical security perimeters" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.2", title: "Physical entry" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.3", title: "Securing offices, rooms and facilities" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.4", title: "Physical security monitoring" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.5", title: "Protecting against physical and environmental threats" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.6", title: "Working in secure areas" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.7", title: "Clear desk and clear screen" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.8", title: "Equipment siting and protection" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.9", title: "Security of assets off-premises" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.10", title: "Storage media" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.11", title: "Supporting utilities" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.12", title: "Cabling security" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.13", title: "Equipment maintenance" },
  { theme: "A.7", themeTitle: "Physical controls", ref: "A.7.14", title: "Secure disposal or re-use of equipment" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.1", title: "User endpoint devices" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.2", title: "Privileged access rights" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.3", title: "Information access restriction" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.4", title: "Access to source code" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.5", title: "Secure authentication" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.6", title: "Capacity management" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.7", title: "Protection against malware" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.8", title: "Management of technical vulnerabilities" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.9", title: "Configuration management" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.10", title: "Information deletion" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.11", title: "Data masking" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.12", title: "Data leakage prevention" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.13", title: "Information backup" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.14", title: "Redundancy of information processing facilities" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.15", title: "Logging" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.16", title: "Monitoring activities" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.17", title: "Clock synchronisation" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.18", title: "Use of privileged utility programs" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.19", title: "Installation of software on operational systems" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.20", title: "Networks security" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.21", title: "Security of network services" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.22", title: "Segregation of networks" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.23", title: "Web filtering" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.24", title: "Use of cryptography" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.25", title: "Secure development life cycle" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.26", title: "Application security requirements" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.27", title: "Secure system architecture and engineering principles" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.28", title: "Secure coding" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.29", title: "Security testing in development and acceptance" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.30", title: "Outsourced development" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.31", title: "Separation of development, test and production environments" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.32", title: "Change management" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.33", title: "Test information" },
  { theme: "A.8", themeTitle: "Technological controls", ref: "A.8.34", title: "Protection of information systems during audit testing" }
];

function q(id, ref, text, t) {
  return { id, ref, question: text, answer_type: t };
}

/** 7–8 questions per ISO/IEC 27001:2022 Annex A control (≥5 as required) */
function buildAnnexQuestions(ref, title) {
  const base = ref.replace(/\./g, "-");
  return [
    q(`${base}-Q1`, ref, `Has the organization defined, approved, and implemented control measures for “${title}” (${ref}) in a manner consistent with the organization’s information security risk treatment?`, "yes_no"),
    q(`${base}-Q2`, ref, `Are roles and responsibilities (including for suppliers or shared services, if applicable) for operating ${ref} documented and effective?`, "yes_no"),
    q(`${base}-Q3`, ref, `Provide evidence that ${ref} is operating (e.g. sample records, tickets, test results, or monitoring outputs from the last 12 months).`, "evidence"),
    q(`${base}-Q4`, ref, `Is ${ref} subject to scheduled review, change control (where applicable), and corrective action when nonconformities are found?`, "yes_no"),
    q(`${base}-Q5`, ref, `Describe any compensating controls, risk acceptance, or current gaps for ${ref} and how these are managed.`, "descriptive"),
    q(`${base}-Q6`, ref, `What objective metrics or assurance activities demonstrate ongoing suitability of the implementation for: ${title}?`, "evidence"),
    q(`${base}-Q7`, ref, `For ${ref}, are training, awareness, or technical standards aligned so personnel follow required procedures in day-to-day operations?`, "yes_no")
  ];
}

const CLAUSES = [
  {
    id: "clause_4",
    number: 4,
    title: "Context of the organisation",
    subclauses: [
      {
        ref: "4.1",
        title: "Understanding the organisation and its context",
        questions: [
          q("4-1-1", "4.1", "Has the organisation determined internal issues that can affect the ISMS (e.g. culture, capabilities, processes)?", "yes_no"),
          q("4-1-2", "4.1", "Has the organisation determined external issues that can affect the ISMS (e.g. legal, technological, market, partner ecosystem)?", "yes_no"),
          q("4-1-3", "4.1", "Is the context review performed at planned intervals and when material changes occur?", "evidence")
        ]
      },
      {
        ref: "4.2",
        title: "Understanding the needs and expectations of interested parties",
        questions: [
          q("4-2-1", "4.2", "Are relevant interested parties (e.g. customers, regulators, parent company) identified for the ISMS scope?", "yes_no"),
          q("4-2-2", "4.2", "Are applicable requirements and expectations of those parties (including which are mandatory) recorded?", "evidence")
        ]
      },
      {
        ref: "4.3",
        title: "Determining the scope of the information security management system",
        questions: [
          q("4-3-1", "4.3", "Is the ISMS scope defined with boundaries and applicability, linked to the organisation’s context and services?", "yes_no"),
          q("4-3-2", "4.3", "Is the scope available as documented information and suitable for certification purposes?", "evidence")
        ]
      },
      {
        ref: "4.4",
        title: "Information security management system",
        questions: [
          q("4-4-1", "4.4", "Is the ISMS established, implemented, maintained, and improved using the PDCA approach required by the standard?", "yes_no"),
          q("4-4-2", "4.4", "Are processes and their interactions (inputs/outputs) defined for the ISMS, including for outsourced work?", "descriptive")
        ]
      }
    ]
  },
  {
    id: "clause_5",
    number: 5,
    title: "Leadership",
    subclauses: [
      {
        ref: "5.1",
        title: "Leadership and commitment",
        questions: [
          q("5-1-1", "5.1", "Is top management accountable for the effectiveness of the ISMS and ensuring policy and objectives align to strategy?", "yes_no"),
          q("5-1-2", "5.1", "Is resources assignment, risk ownership, and continual improvement direction demonstrated by management?", "evidence"),
          q("5-1-3", "5.1", "Does management support integration of ISMS requirements into business processes and promote awareness of importance?", "yes_no")
        ]
      },
      {
        ref: "5.2",
        title: "Policy",
        questions: [
          q("5-2-1", "5.2", "Is an information security policy established, appropriate to the organisation, and approved by top management?", "yes_no"),
          q("5-2-2", "5.2", "Are commitments to satisfy applicable requirements and continual improvement included in the policy?", "yes_no"),
          q("5-2-3", "5.2", "Is the policy communicated, available, and (as relevant) acknowledged by interested parties?", "evidence")
        ]
      },
      {
        ref: "5.3",
        title: "Organisational roles, responsibilities and authorities",
        questions: [
          q("5-3-1", "5.3", "Are ISMS roles, responsibilities, and authorities assigned and documented?", "yes_no"),
          q("5-3-2", "5.3", "Is there an appointed information security function or equivalent with clear mandate?", "evidence")
        ]
      }
    ]
  },
  {
    id: "clause_6",
    number: 6,
    title: "Planning",
    subclauses: [
      {
        ref: "6.1",
        title: "Actions to address risks and opportunities",
        questions: [
          q("6-1-1", "6.1", "Is the information security risk assessment process defined, including criteria, methods, and ownership of outcomes?", "yes_no"),
          q("6-1-2", "6.1", "Is the risk treatment plan integrated with the management system and resourced to achieve objectives?", "evidence"),
          q("6-1-3", "6.1", "Are opportunities to improve the ISMS considered alongside treatment of information security risks?", "yes_no"),
          q("6-1-4", "6.1", "Is the link between information security risk results and the statement of applicable controls and objectives explicit and up to date?", "evidence")
        ]
      },
      {
        ref: "6.2",
        title: "Information security objectives and planning to achieve them",
        questions: [
          q("6-2-1", "6.2", "Are measurable information security objectives established at relevant functions/levels, consistent with the policy?", "yes_no"),
          q("6-2-2", "6.2", "Is planning documented for what will be done, resources, responsibilities, timeframes, and how results are evaluated?", "evidence"),
          q("6-2-3", "6.2", "How is objective achievement measured and is progress reported to management in a way that supports decisions?", "descriptive")
        ]
      },
      {
        ref: "6.3",
        title: "Planning of changes",
        questions: [
          q("6-3-1", "6.3", "When the ISMS needs change, is the change carried out in a planned manner, considering risk impacts?", "yes_no"),
          q("6-3-2", "6.3", "Describe a recent change to the ISMS and how information security was considered in planning.", "descriptive"),
          q("6-3-3", "6.3", "Are change requests linked to the risk assessment and/or management review when they affect scope, assets, or controls?", "yes_no")
        ]
      }
    ]
  },
  {
    id: "clause_7",
    number: 7,
    title: "Support",
    subclauses: [
      { ref: "7.1", title: "Resources", questions: [q("7-1-1", "7.1", "Are necessary resources (people, time, money, technology) made available to establish and maintain the ISMS?", "yes_no"), q("7-1-2", "7.1", "Is budget/forecast evidence available showing investment aligned to information security needs?", "evidence")] },
      { ref: "7.2", title: "Competence", questions: [q("7-2-1", "7.2", "For persons whose work affects information security, is necessary competence defined and how attainment is determined?", "yes_no"), q("7-2-2", "7.2", "Provide training records, certifications, or gap analyses supporting competence claims for key ISMS roles.", "evidence")] },
      { ref: "7.3", title: "Awareness", questions: [q("7-3-1", "7.3", "Do relevant personnel understand the ISMS policy, their contribution, and consequences of nonconformity?", "yes_no"), q("7-3-2", "7.3", "Is security awareness content relevant to job role and provided at defined intervals, with metrics where appropriate?", "evidence")] },
      { ref: "7.4", title: "Communication", questions: [q("7-4-1", "7.4", "What, when, with whom, and how the organisation will communicate on ISMS matters, including external parties?", "evidence"), q("7-4-2", "7.4", "Are communications (internal and external) recorded where needed for the ISMS?", "yes_no")] },
      { ref: "7.5", title: "Documented information", questions: [q("7-5-1", "7.5", "Is the extent of documented information determined for the ISMS, including where it is created, updated, and controlled?", "yes_no"), q("7-5-2", "7.5", "Are distribution, access, storage, and retention/ disposition controls applied to protect documented information appropriately?", "evidence")] }
    ]
  },
  {
    id: "clause_8",
    number: 8,
    title: "Operation",
    subclauses: [
      { ref: "8.1", title: "Operational planning and control", questions: [q("8-1-1", "8.1", "Are information security plans implemented and controls operated as part of the risk treatment plan?", "yes_no"), q("8-1-2", "8.1", "Are changes to planned activities assessed for their impact on the ISMS and controlled (including outsourced work)?", "evidence"), q("8-1-3", "8.1", "Is control implementation aligned to documented plans and are exceptions tracked?", "descriptive")] },
      { ref: "8.2", title: "Information security risk assessment", questions: [q("8-2-1", "8.2", "Are risk assessments performed at planned intervals and on significant change?", "yes_no"), q("8-2-2", "8.2", "Is risk information retained, including how likelihood and impact were derived for significant risks?", "evidence"), q("8-2-3", "8.2", "Is treatment consistency with methodology reviewed when business context, assets, or threats change meaningfully?", "yes_no")] },
      { ref: "8.3", title: "Information security risk treatment", questions: [q("8-3-1", "8.3", "Is a statement of applicable controls (incl. justification for Annex A) maintained and is residual risk owner-approved where needed?", "yes_no"), q("8-3-2", "8.3", "Show evidence of implementation status for the statement of applicable controls, including for suppliers.", "evidence"), q("8-3-3", "8.3", "If controls are not implemented, is risk treatment decision-making recorded (e.g. risk acceptance) with sign-off?", "yes_no")] }
    ]
  },
  {
    id: "clause_9",
    number: 9,
    title: "Performance evaluation",
    subclauses: [
      { ref: "9.1", title: "Monitoring, measurement, analysis and evaluation", questions: [q("9-1-1", "9.1", "Are what needs to be monitored and measured, methods, and evaluation criteria for ISMS performance defined?", "yes_no"), q("9-1-2", "9.1", "Are results of monitoring reviewed by appropriate personnel and is evidence of trends retained (e.g. dashboards, reports)?", "evidence"), q("9-1-3", "9.1", "Is performance data used to support management review and opportunities for improvement?", "yes_no")] },
      { ref: "9.2", title: "Internal audit", questions: [q("9-2-1", "9.2", "Is an internal audit programme planned with defined frequency, scope, and criteria, independent to the degree practicable?", "yes_no"), q("9-2-2", "9.2", "Can you provide recent internal audit reports, findings, and evidence of follow-up/closure of nonconformities?", "evidence"), q("9-2-3", "9.2", "Are auditors competent and do audit records demonstrate ISO 27001 (ISMS) requirements were covered in scope?", "yes_no")] },
      { ref: "9.3", title: "Management review", questions: [q("9-3-1", "9.3", "Does top management review the ISMS at planned intervals, including inputs (audit, incidents, risk changes) and output decisions (resources, changes)?", "evidence"), q("9-3-2", "9.3", "Are management review minutes/records of decisions retained and is follow-through visible?", "yes_no"), q("9-3-3", "9.3", "Describe how the outcome of the last review changed priorities or the ISMS within the last cycle.", "descriptive")] }
    ]
  },
  {
    id: "clause_10",
    number: 10,
    title: "Improvement",
    subclauses: [
      { ref: "10.1", title: "Continual improvement", questions: [q("10-1-1", "10.1", "Does the organisation actively pursue continual improvement of the suitability, adequacy, and effectiveness of the ISMS?", "yes_no"), q("10-1-2", "10.1", "Is improvement data sourced from performance evaluation, lessons learned, and objectives progress?", "evidence"), q("10-1-3", "10.1", "Are security incidents, near misses, and trends used as inputs to improve controls and the ISMS?", "yes_no"), q("10-1-4", "10.1", "Is there a process to prioritise, assign ownership, and track improvement actions with measurable completion criteria?", "evidence") ] },
      { ref: "10.2", title: "Nonconformity and corrective action", questions: [q("10-2-1", "10.2", "When a nonconformity occurs, is the reaction, cause analysis, and corrective action (including need for change) taken?", "yes_no"), q("10-2-2", "10.2", "Provide a corrective action record showing root cause, action plan, review of effectiveness, and updated risks where relevant.", "evidence"), q("10-2-3", "10.2", "Are nonconformities (including from audits) tracked to closure and is recurrence prevented to the extent practicable?", "descriptive"), q("10-2-4", "10.2", "Are corrective actions completed within target timescales, with re-testing or verification of controls where required?", "yes_no") ] }
    ]
  }
];

function groupAnnexByTheme(controls) {
  const m = new Map();
  for (const c of controls) {
    if (!m.has(c.theme)) m.set(c.theme, { id: c.theme, title: c.themeTitle, controls: [] });
    m.get(c.theme).controls.push({ ref: c.ref, title: c.title, questions: c.questions });
  }
  return { standard: "ISO/IEC 27001:2022", themes: Array.from(m.values()) };
}

function buildTextFile(clauses, annex) {
  const lines = [];
  const sep = (t) => {
    lines.push("============================================================");
    lines.push(t);
    lines.push("============================================================");
  };
  for (const cl of clauses) {
    sep(`CLAUSE ${cl.number} — ${cl.title}`);
    for (const sc of cl.subclauses) {
      let n = 1;
      for (const qq of sc.questions) {
        lines.push(`${sc.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
    lines.push("");
  }
  sep("ANNEX A — A.5 Organisational controls");
  for (const th of annex.themes.filter((t) => t.id === "A.5")) {
    for (const ctrl of th.controls) {
      let n = 1;
      for (const qq of ctrl.questions) {
        lines.push(`${ctrl.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
  }
  lines.push("");
  sep("ANNEX A — A.6 People controls");
  for (const th of annex.themes.filter((t) => t.id === "A.6")) {
    for (const ctrl of th.controls) {
      let n = 1;
      for (const qq of ctrl.questions) {
        lines.push(`${ctrl.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
  }
  lines.push("");
  sep("ANNEX A — A.7 Physical controls");
  for (const th of annex.themes.filter((t) => t.id === "A.7")) {
    for (const ctrl of th.controls) {
      let n = 1;
      for (const qq of ctrl.questions) {
        lines.push(`${ctrl.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
  }
  lines.push("");
  sep("ANNEX A — A.8 Technological controls");
  for (const th of annex.themes.filter((t) => t.id === "A.8")) {
    for (const ctrl of th.controls) {
      let n = 1;
      for (const qq of ctrl.questions) {
        lines.push(`${ctrl.ref}  Q${n}: ${qq.question}`);
        n += 1;
      }
    }
  }
  return lines.join("\n") + "\n";
}

function main() {
  const annexControls = ANNEX_CONTROLS.map((c) => ({
    ref: c.ref,
    title: c.title,
    theme: c.theme,
    themeTitle: c.themeTitle,
    questions: buildAnnexQuestions(c.ref, c.title)
  }));
  const annex = groupAnnexByTheme(annexControls);
  const clausesOut = { standard: "ISO/IEC 27001:2022", meta: { clauses: "4-10" }, clauses: CLAUSES };

  mkdirSync(join(root, "data"), { recursive: true });
  mkdirSync(join(root, "output"), { recursive: true });
  writeFileSync(join(root, "data", "clauses.json"), JSON.stringify(clausesOut, null, 2), "utf8");
  writeFileSync(join(root, "data", "annex_a.json"), JSON.stringify(annex, null, 2), "utf8");
  writeFileSync(join(root, "output", "iso27001_full_question_list.txt"), buildTextFile(CLAUSES, annex), "utf8");
  const clauseQ = CLAUSES.reduce((a, c) => a + c.subclauses.reduce((b, s) => b + s.questions.length, 0), 0);
  const annexQ = annexControls.reduce((a, c) => a + c.questions.length, 0);
  console.log("Wrote iso27001 data files. Clause questions:", clauseQ, "Annex A questions:", annexQ, "Total:", clauseQ + annexQ);
}

main();
