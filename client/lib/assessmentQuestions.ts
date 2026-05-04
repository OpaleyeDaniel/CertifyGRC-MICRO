// File evidence metadata for supporting multiple files per question
export interface EvidenceFile {
  url: string;
  name: string;
  size: number; // in bytes
  sourceKind?: "local" | "cloud";
  storageMode?: "import" | "link";
  providerId?: string;
  externalFileId?: string;
  externalPath?: string;
  attachedBy?: string;
  attachedAt?: string;
}

// Merged NIST CSF 2.0 Assessment Questions with enhanced fields
export interface AssessmentQuestion {
  id: string;
  function: string;
  category: string;
  nist_id: string;
  question: string;
  requiresEvidence: boolean;
  userAnswer: string | null;
  maturityScore: number | null; // null for unanswered (not 0 - level 0 removed)
  comment: string;
  evidenceUrl: string | null; // DEPRECATED: kept for backward compatibility, use evidenceFiles instead
  evidenceFileSize: number | null; // DEPRECATED: kept for backward compatibility
  evidenceFiles: EvidenceFile[]; // NEW: array of multiple evidence files
  sidebarHome: string;
  gap_flag?: boolean; // Computed: true if answer is 'Partial' or 'No'
}

// Helper function to determine sidebar home based on category
export const determineSidebarHome = (category: string): string => {
  return "Assessment";
};

// All NIST CSF 2.0 Questions (118 total)
const allNistQuestions = [
  // --- GOVERN (GV) ---
  { function: "GOVERN", category: "GV.OC – Organizational Context", nist_id: "GV.OC-01", question: "Do you clearly understand what information and systems are critical to your organization's mission?" },
  { function: "GOVERN", category: "GV.OC – Organizational Context", nist_id: "GV.OC-02", question: "Have you identified your organization's legal, regulatory, and contractual cybersecurity requirements?" },
  { function: "GOVERN", category: "GV.OC – Organizational Context", nist_id: "GV.OC-03", question: "Do you know your key internal and external stakeholders who rely on your systems or data?" },
  { function: "GOVERN", category: "GV.OC – Organizational Context", nist_id: "GV.OC-04", question: "Do you review your organizational context regularly (e.g., when business operations change)?" },
  { function: "GOVERN", category: "GV.RM – Risk Management Strategy", nist_id: "GV.RM-01", question: "Do you have a formal strategy for managing cybersecurity risks?" },
  { function: "GOVERN", category: "GV.RM – Risk Management Strategy", nist_id: "GV.RM-02", question: "Does your organization define acceptable levels of risk?" },
  { function: "GOVERN", category: "GV.RM – Risk Management Strategy", nist_id: "GV.RM-03", question: "Is your cybersecurity risk appetite communicated to staff and partners?" },
  { function: "GOVERN", category: "GV.RM – Risk Management Strategy", nist_id: "GV.RM-04", question: "Do you periodically review and adjust your risk management strategy?" },
  { function: "GOVERN", category: "GV.PO – Roles, Responsibilities, and Authorities", nist_id: "GV.PO-01", question: "Are cybersecurity roles and responsibilities clearly defined across the organization?" },
  { function: "GOVERN", category: "GV.PO – Roles, Responsibilities, and Authorities", nist_id: "GV.PO-02", question: "Do employees know who is accountable for cybersecurity decisions?" },
  { function: "GOVERN", category: "GV.PO – Roles, Responsibilities, and Authorities", nist_id: "GV.PO-03", question: "Are cybersecurity authorities documented in policies or governance documents?" },
  { function: "GOVERN", category: "GV.PO – Roles, Responsibilities, and Authorities", nist_id: "GV.PO-04", question: "Are responsibilities reviewed and updated when the organization changes?" },
  { function: "GOVERN", category: "GV.RR – Risk Management Oversight", nist_id: "GV.RR-01", question: "Does top management actively oversee cybersecurity risk management?" },
  { function: "GOVERN", category: "GV.RR – Risk Management Oversight", nist_id: "GV.RR-02", question: "Are cybersecurity metrics and performance reported to leadership?" },
  { function: "GOVERN", category: "GV.RR – Risk Management Oversight", nist_id: "GV.RR-03", question: "Is there independent oversight (e.g., audit or compliance review)?" },
  { function: "GOVERN", category: "GV.RR – Risk Management Oversight", nist_id: "GV.RR-04", question: "Are lessons learned from oversight used to improve governance?" },
  { function: "GOVERN", category: "GV.OT – Cybersecurity Supply Chain Risk Management", nist_id: "GV.OT-01", question: "Do you assess cybersecurity risks from vendors and partners?" },
  { function: "GOVERN", category: "GV.OT – Cybersecurity Supply Chain Risk Management", nist_id: "GV.OT-02", question: "Are there requirements for suppliers to meet your cybersecurity standards?" },
  { function: "GOVERN", category: "GV.OT – Cybersecurity Supply Chain Risk Management", nist_id: "GV.OT-03", question: "Do you monitor supplier cybersecurity performance over time?" },
  { function: "GOVERN", category: "GV.OT – Cybersecurity Supply Chain Risk Management", nist_id: "GV.OT-04", question: "Do you plan for continuity if a key supplier experiences a cyber incident?" },

  // --- IDENTIFY (ID) ---
  { function: "IDENTIFY", category: "ID.AM – Asset Management", nist_id: "ID.AM-01", question: "Do you maintain an up-to-date inventory of all hardware, software, and data assets?" },
  { function: "IDENTIFY", category: "ID.AM – Asset Management", nist_id: "ID.AM-02", question: "Do you know which systems are critical to your business operations?" },
  { function: "IDENTIFY", category: "ID.AM – Asset Management", nist_id: "ID.AM-03", question: "Are asset owners identified for each major system or dataset?" },
  { function: "IDENTIFY", category: "ID.AM – Asset Management", nist_id: "ID.AM-04", question: "Do you track third-party or cloud assets used by your organization?" },
  { function: "IDENTIFY", category: "ID.AM – Asset Management", nist_id: "ID.AM-05", question: "Is asset inventory reviewed and updated regularly?" },
  { function: "IDENTIFY", category: "ID.BE – Business Environment", nist_id: "ID.BE-01", question: "Is your organization's mission and objectives clearly documented?" },
  { function: "IDENTIFY", category: "ID.BE – Business Environment", nist_id: "ID.BE-02", question: "Have you identified which services are most critical to achieving business goals?" },
  { function: "IDENTIFY", category: "ID.BE – Business Environment", nist_id: "ID.BE-03", question: "Do you understand how your organization fits into the larger supply chain?" },
  { function: "IDENTIFY", category: "ID.BE – Business Environment", nist_id: "ID.BE-04", question: "Do you assess the potential impact of a cybersecurity event on your business?" },
  { function: "IDENTIFY", category: "ID.DP – Data Processing Ecosystem", nist_id: "ID.DP-01", question: "Do you know where your organization's data is stored and processed?" },
  { function: "IDENTIFY", category: "ID.DP – Data Processing Ecosystem", nist_id: "ID.DP-02", question: "Are data flows between systems and third parties documented?" },
  { function: "IDENTIFY", category: "ID.DP – Data Processing Ecosystem", nist_id: "ID.DP-03", question: "Are privacy and protection needs identified for each type of data?" },
  { function: "IDENTIFY", category: "ID.RA – Risk Assessment", nist_id: "ID.RA-01", question: "Do you regularly identify potential cybersecurity threats and vulnerabilities?" },
  { function: "IDENTIFY", category: "ID.RA – Risk Assessment", nist_id: "ID.RA-02", question: "Are risk assessments conducted for new systems or major changes?" },
  { function: "IDENTIFY", category: "ID.RA – Risk Assessment", nist_id: "ID.RA-03", question: "Do you assess the likelihood and impact of cybersecurity events?" },
  { function: "IDENTIFY", category: "ID.RA – Risk Assessment", nist_id: "ID.RA-04", question: "Are results from risk assessments shared with decision-makers?" },
  { function: "IDENTIFY", category: "ID.RA – Risk Assessment", nist_id: "ID.RA-05", question: "Do you update risk assessments when new threats emerge?" },
  { function: "IDENTIFY", category: "ID.IM – Improvement", nist_id: "ID.IM-01", question: "Do you have a process to improve your cybersecurity practices over time?" },
  { function: "IDENTIFY", category: "ID.IM – Improvement", nist_id: "ID.IM-02", question: "Are lessons learned from incidents used to refine policies and procedures?" },
  { function: "IDENTIFY", category: "ID.IM – Improvement", nist_id: "ID.IM-03", question: "Is there a mechanism to track and measure cybersecurity improvements?" },

  // --- PROTECT (PR) ---
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-01", question: "Are all users uniquely identified and authenticated before accessing systems?" },
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-02", question: "Are access rights based on roles and job responsibilities?" },
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-03", question: "Are user privileges reviewed regularly?" },
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-04", question: "Do you disable unused or inactive accounts promptly?" },
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-05", question: "Do you use multi-factor authentication for critical systems?" },
  { function: "PROTECT", category: "PR.AA – Identity Management & Access Control", nist_id: "PR.AA-06", question: "Are third-party access permissions controlled and monitored?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-01", question: "Is sensitive data classified (e.g., public, confidential, restricted)?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-02", question: "Is data protected while stored and transmitted?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-03", question: "Are encryption and access controls applied appropriately?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-04", question: "Are backups regularly created and tested?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-05", question: "Is removable media use controlled or restricted?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-06", question: "Are data retention and disposal policies defined?" },
  { function: "PROTECT", category: "PR.DS – Data Security", nist_id: "PR.DS-07", question: "Are integrity checks in place to detect unauthorized data changes?" },
  { function: "PROTECT", category: "PR.PS – Platform Security", nist_id: "PR.PS-01", question: "Are systems configured securely according to best practices?" },
  { function: "PROTECT", category: "PR.PS – Platform Security", nist_id: "PR.PS-02", question: "Are operating systems and applications kept up to date with patches?" },
  { function: "PROTECT", category: "PR.PS – Platform Security", nist_id: "PR.PS-03", question: "Are unauthorized changes or installations detected?" },
  { function: "PROTECT", category: "PR.PS – Platform Security", nist_id: "PR.PS-04", question: "Are configurations reviewed periodically for compliance?" },
  { function: "PROTECT", category: "PR.TV – Technology Infrastructure Resilience", nist_id: "PR.TV-01", question: "Are redundancy and failover measures in place for critical systems?" },
  { function: "PROTECT", category: "PR.TV – Technology Infrastructure Resilience", nist_id: "PR.TV-02", question: "Are you able to maintain essential operations during disruptions?" },
  { function: "PROTECT", category: "PR.TV – Technology Infrastructure Resilience", nist_id: "PR.TV-03", question: "Are resilience measures tested periodically?" },
  { function: "PROTECT", category: "PR.TV – Technology Infrastructure Resilience", nist_id: "PR.TV-04", question: "Are lessons from past disruptions applied to strengthen resilience?" },
  { function: "PROTECT", category: "PR.MA – Maintenance", nist_id: "PR.MA-01", question: "Are systems maintained and updated regularly?" },
  { function: "PROTECT", category: "PR.MA – Maintenance", nist_id: "PR.MA-02", question: "Are maintenance activities authorized and logged?" },
  { function: "PROTECT", category: "PR.MA – Maintenance", nist_id: "PR.MA-03", question: "Are remote maintenance sessions secured and monitored?" },
  { function: "PROTECT", category: "PR.IR – Protective Technology", nist_id: "PR.IR-01", question: "Are protective tools (e.g., antivirus, firewalls, EDR) implemented and maintained?" },
  { function: "PROTECT", category: "PR.IR – Protective Technology", nist_id: "PR.IR-02", question: "Are their configurations aligned with policies and requirements?" },
  { function: "PROTECT", category: "PR.IR – Protective Technology", nist_id: "PR.IR-03", question: "Are security resources adequately supported and updated?" },

  // --- DETECT (DE) ---
  { function: "DETECT", category: "DE.AE – Anomalies and Events", nist_id: "DE.AE-01", question: "Do you have defined baselines for normal system behavior?" },
  { function: "DETECT", category: "DE.AE – Anomalies and Events", nist_id: "DE.AE-02", question: "Are anomalies and security events detected in real-time?" },
  { function: "DETECT", category: "DE.AE – Anomalies and Events", nist_id: "DE.AE-03", question: "Are alerts investigated to determine their impact?" },
  { function: "DETECT", category: "DE.AE – Anomalies and Events", nist_id: "DE.AE-04", question: "Is data from multiple sources correlated for better detection?" },
  { function: "DETECT", category: "DE.AE – Anomalies and Events", nist_id: "DE.AE-05", question: "Are lessons from past events used to improve detection?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-01", question: "Are networks, systems, and users continuously monitored for threats?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-02", question: "Are monitoring tools properly configured and maintained?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-03", question: "Are alerts reviewed and escalated promptly?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-04", question: "Are logs collected, analyzed, and stored securely?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-05", question: "Are monitoring activities aligned with organizational risk tolerance?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-06", question: "Do you use threat intelligence to enhance monitoring?" },
  { function: "DETECT", category: "DE.CM – Security Continuous Monitoring", nist_id: "DE.CM-07", question: "Is third-party monitoring integrated into your program?" },
  { function: "DETECT", category: "DE.DP – Detection Processes", nist_id: "DE.DP-01", question: "Are detection processes documented and standardized?" },
  { function: "DETECT", category: "DE.DP – Detection Processes", nist_id: "DE.DP-02", question: "Are detection roles and responsibilities clearly defined?" },
  { function: "DETECT", category: "DE.DP – Detection Processes", nist_id: "DE.DP-03", question: "Are detection capabilities tested and improved over time?" },
  { function: "DETECT", category: "DE.DP – Detection Processes", nist_id: "DE.DP-04", question: "Are tools and processes reviewed after incidents?" },

  // --- RESPOND (RS) ---
  { function: "RESPOND", category: "RS.MA – Incident Management", nist_id: "RS.MA-01", question: "Do you have a documented incident response plan?" },
  { function: "RESPOND", category: "RS.MA – Incident Management", nist_id: "RS.MA-02", question: "Are roles and responsibilities clearly defined during incidents?" },
  { function: "RESPOND", category: "RS.MA – Incident Management", nist_id: "RS.MA-03", question: "Are response procedures tested regularly (e.g., simulations)?" },
  { function: "RESPOND", category: "RS.MA – Incident Management", nist_id: "RS.MA-04", question: "Are incidents prioritized based on impact and urgency?" },
  { function: "RESPOND", category: "RS.MA – Incident Management", nist_id: "RS.MA-05", question: "Are response lessons learned captured and applied?" },
  { function: "RESPOND", category: "RS.CO – Communications", nist_id: "RS.CO-01", question: "Do you have a communication plan for cybersecurity incidents?" },
  { function: "RESPOND", category: "RS.CO – Communications", nist_id: "RS.CO-02", question: "Are internal and external communication channels defined?" },
  { function: "RESPOND", category: "RS.CO – Communications", nist_id: "RS.CO-03", question: "Do you coordinate with external stakeholders (e.g., law enforcement)?" },
  { function: "RESPOND", category: "RS.CO – Communications", nist_id: "RS.CO-04", question: "Are incident notifications sent according to legal requirements?" },
  { function: "RESPOND", category: "RS.CO – Communications", nist_id: "RS.CO-05", question: "Are communication procedures updated after major incidents?" },
  { function: "RESPOND", category: "RS.AN – Analysis", nist_id: "RS.AN-01", question: "Are incidents analyzed to determine their cause and scope?" },
  { function: "RESPOND", category: "RS.AN – Analysis", nist_id: "RS.AN-02", question: "Is evidence properly collected and preserved?" },
  { function: "RESPOND", category: "RS.AN – Analysis", nist_id: "RS.AN-03", question: "Are incident impacts assessed (e.g., data loss, downtime)?" },
  { function: "RESPOND", category: "RS.AN – Analysis", nist_id: "RS.AN-04", question: "Are results of analysis shared with decision-makers?" },
  { function: "RESPOND", category: "RS.IM – Mitigation", nist_id: "RS.IM-01", question: "Are containment and eradication actions taken quickly?" },
  { function: "RESPOND", category: "RS.IM – Mitigation", nist_id: "RS.IM-02", question: "Are temporary fixes replaced with permanent solutions?" },
  { function: "RESPOND", category: "RS.IM – Mitigation", nist_id: "RS.IM-03", question: "Is progress of mitigation tracked and reviewed?" },
  { function: "RESPOND", category: "RS.IMV – Improvements", nist_id: "RS.IMV-01", question: "Are incident response plans updated after each incident?" },
  { function: "RESPOND", category: "RS.IMV – Improvements", nist_id: "RS.IMV-02", question: "Are corrective actions implemented to prevent recurrence?" },
  { function: "RESPOND", category: "RS.IMV – Improvements", nist_id: "RS.IMV-03", question: "Are improvements communicated to all stakeholders?" },

  // --- RECOVER (RC) ---
  { function: "RECOVER", category: "RC.MA – Incident Recovery Management", nist_id: "RC.MA-01", question: "Do you have a formal recovery plan for cyber incidents?" },
  { function: "RECOVER", category: "RC.MA – Incident Recovery Management", nist_id: "RC.MA-02", question: "Are roles and responsibilities clear during recovery?" },
  { function: "RECOVER", category: "RC.MA – Incident Recovery Management", nist_id: "RC.MA-03", question: "Are recovery steps tested and rehearsed?" },
  { function: "RECOVER", category: "RC.MA – Incident Recovery Management", nist_id: "RC.MA-04", question: "Are recovery objectives (RTO/RPO) defined and achievable?" },
  { function: "RECOVER", category: "RC.CO – Communications", nist_id: "RC.CO-01", question: "Is there a communication plan for recovery updates?" },
  { function: "RECOVER", category: "RC.CO – Communications", nist_id: "RC.CO-02", question: "Are internal and external stakeholders kept informed during recovery?" },
  { function: "RECOVER", category: "RC.CO – Communications", nist_id: "RC.CO-03", question: "Is communication managed to maintain trust and transparency?" },
  { function: "RECOVER", category: "RC.IM – Improvements", nist_id: "RC.IM-01", question: "Are lessons from recovery efforts documented and applied?" },
  { function: "RECOVER", category: "RC.IM – Improvements", nist_id: "RC.IM-02", question: "Are recovery plans updated after incidents?" },
  { function: "RECOVER", category: "RC.IM – Improvements", nist_id: "RC.IM-03", question: "Are post-incident reports used to strengthen resilience?" }
];

// Merge and enhance all questions
export const createAllQuestions = (): AssessmentQuestion[] => {
  return allNistQuestions.map((q) => ({
    id: q.nist_id,
    ...q,
    requiresEvidence: true,
    userAnswer: null,
    maturityScore: null, // null for unanswered (level 0 removed)
    comment: "",
    evidenceUrl: null, // DEPRECATED: kept for backward compatibility
    evidenceFileSize: null, // DEPRECATED: kept for backward compatibility
    evidenceFiles: [], // NEW: start with empty array for multiple files
    sidebarHome: determineSidebarHome(q.category)
  }));
};

// Get questions for a specific page
export const getQuestionsForPage = (allQuestions: AssessmentQuestion[], pageName: string): AssessmentQuestion[] => {
  return allQuestions.filter(q => q.sidebarHome === pageName);
};
