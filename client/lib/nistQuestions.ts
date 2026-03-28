// NIST CSF 2.0 Assessment Questions Data
export interface AssessmentQuestion {
  id: string;
  function: string;
  category: string;
  nist_id: string;
  question: string;
  page: string;
}

export interface AssessmentResponse {
  nist_id: string;
  question: string;
  score: number;
  comment?: string;
  timestamp?: Date;
}

export const nistQuestions: AssessmentQuestion[] = [
  // --- GOVERN (Assessment page) ---
  {
    id: "GV.OC-01",
    function: "GOVERN",
    category: "GV.OC – Organizational Context",
    nist_id: "GV.OC-01",
    question: "Do you clearly understand what information and systems are critical to your organization's mission?",
    page: "Assessment"
  },
  {
    id: "GV.OC-02",
    function: "GOVERN",
    category: "GV.OC – Organizational Context",
    nist_id: "GV.OC-02",
    question: "Have you identified your organization's legal, regulatory, and contractual cybersecurity requirements?",
    page: "Assessment"
  },
  {
    id: "GV.OC-03",
    function: "GOVERN",
    category: "GV.OC – Organizational Context",
    nist_id: "GV.OC-03",
    question: "Do you know your key internal and external stakeholders who rely on your systems or data?",
    page: "Assessment"
  },
  {
    id: "GV.OC-04",
    function: "GOVERN",
    category: "GV.OC – Organizational Context",
    nist_id: "GV.OC-04",
    question: "Do you review your organizational context regularly (e.g., when business operations change)?",
    page: "Assessment"
  },
  {
    id: "GV.RM-01",
    function: "GOVERN",
    category: "GV.RM – Risk Management Strategy",
    nist_id: "GV.RM-01",
    question: "Do you have a formal strategy for managing cybersecurity risks?",
    page: "Assessment"
  },
  {
    id: "GV.RM-02",
    function: "GOVERN",
    category: "GV.RM – Risk Management Strategy",
    nist_id: "GV.RM-02",
    question: "Does your organization define acceptable levels of risk?",
    page: "Assessment"
  },
  {
    id: "GV.RM-03",
    function: "GOVERN",
    category: "GV.RM – Risk Management Strategy",
    nist_id: "GV.RM-03",
    question: "Is your cybersecurity risk appetite communicated to staff and partners?",
    page: "Assessment"
  },
  {
    id: "GV.RM-04",
    function: "GOVERN",
    category: "GV.RM – Risk Management Strategy",
    nist_id: "GV.RM-04",
    question: "Do you periodically review and adjust your risk management strategy?",
    page: "Assessment"
  },
  {
    id: "GV.PO-01",
    function: "GOVERN",
    category: "GV.PO – Roles, Responsibilities, and Authorities",
    nist_id: "GV.PO-01",
    question: "Are cybersecurity roles and responsibilities clearly defined across the organization?",
    page: "Assessment"
  },
  {
    id: "GV.PO-02",
    function: "GOVERN",
    category: "GV.PO – Roles, Responsibilities, and Authorities",
    nist_id: "GV.PO-02",
    question: "Do employees know who is accountable for cybersecurity decisions?",
    page: "Assessment"
  },
  {
    id: "GV.PO-03",
    function: "GOVERN",
    category: "GV.PO – Roles, Responsibilities, and Authorities",
    nist_id: "GV.PO-03",
    question: "Are cybersecurity authorities documented in policies or governance documents?",
    page: "Assessment"
  },
  {
    id: "GV.PO-04",
    function: "GOVERN",
    category: "GV.PO – Roles, Responsibilities, and Authorities",
    nist_id: "GV.PO-04",
    question: "Are responsibilities reviewed and updated when the organization changes?",
    page: "Assessment"
  },
  {
    id: "GV.RR-01",
    function: "GOVERN",
    category: "GV.RR – Risk Management Oversight",
    nist_id: "GV.RR-01",
    question: "Does top management actively oversee cybersecurity risk management?",
    page: "Assessment"
  },
  {
    id: "GV.RR-02",
    function: "GOVERN",
    category: "GV.RR – Risk Management Oversight",
    nist_id: "GV.RR-02",
    question: "Are cybersecurity metrics and performance reported to leadership?",
    page: "Assessment"
  },
  {
    id: "GV.RR-03",
    function: "GOVERN",
    category: "GV.RR – Risk Management Oversight",
    nist_id: "GV.RR-03",
    question: "Is there independent oversight (e.g., audit or compliance review)?",
    page: "Assessment"
  },
  {
    id: "GV.RR-04",
    function: "GOVERN",
    category: "GV.RR – Risk Management Oversight",
    nist_id: "GV.RR-04",
    question: "Are lessons learned from oversight used to improve governance?",
    page: "Assessment"
  },
  {
    id: "GV.OT-01",
    function: "GOVERN",
    category: "GV.OT – Cybersecurity Supply Chain Risk Management",
    nist_id: "GV.OT-01",
    question: "Do you assess cybersecurity risks from vendors and partners?",
    page: "Assessment"
  },
  {
    id: "GV.OT-02",
    function: "GOVERN",
    category: "GV.OT – Cybersecurity Supply Chain Risk Management",
    nist_id: "GV.OT-02",
    question: "Are there requirements for suppliers to meet your cybersecurity standards?",
    page: "Assessment"
  },
  {
    id: "GV.OT-03",
    function: "GOVERN",
    category: "GV.OT – Cybersecurity Supply Chain Risk Management",
    nist_id: "GV.OT-03",
    question: "Do you monitor supplier cybersecurity performance over time?",
    page: "Assessment"
  },
  {
    id: "GV.OT-04",
    function: "GOVERN",
    category: "GV.OT – Cybersecurity Supply Chain Risk Management",
    nist_id: "GV.OT-04",
    question: "Do you plan for continuity if a key supplier experiences a cyber incident?",
    page: "Assessment"
  },
  // --- IDENTIFY (Risk Assessment page) ---
  {
    id: "ID.AM-01",
    function: "IDENTIFY",
    category: "ID.AM – Asset Management",
    nist_id: "ID.AM-01",
    question: "Do you maintain an up-to-date inventory of all hardware, software, and data assets?",
    page: "Risk Assessment"
  },
  {
    id: "ID.AM-02",
    function: "IDENTIFY",
    category: "ID.AM – Asset Management",
    nist_id: "ID.AM-02",
    question: "Do you know which systems are critical to your business operations?",
    page: "Risk Assessment"
  },
  {
    id: "ID.AM-03",
    function: "IDENTIFY",
    category: "ID.AM – Asset Management",
    nist_id: "ID.AM-03",
    question: "Are asset owners identified for each major system or dataset?",
    page: "Risk Assessment"
  },
  {
    id: "ID.AM-04",
    function: "IDENTIFY",
    category: "ID.AM – Asset Management",
    nist_id: "ID.AM-04",
    question: "Do you track third-party or cloud assets used by your organization?",
    page: "Risk Assessment"
  },
  {
    id: "ID.AM-05",
    function: "IDENTIFY",
    category: "ID.AM – Asset Management",
    nist_id: "ID.AM-05",
    question: "Is asset inventory reviewed and updated regularly?",
    page: "Risk Assessment"
  },
  {
    id: "ID.BE-01",
    function: "IDENTIFY",
    category: "ID.BE – Business Environment",
    nist_id: "ID.BE-01",
    question: "Is your organization's mission and objectives clearly documented?",
    page: "Risk Assessment"
  },
  {
    id: "ID.BE-02",
    function: "IDENTIFY",
    category: "ID.BE – Business Environment",
    nist_id: "ID.BE-02",
    question: "Have you identified which services are most critical to achieving business goals?",
    page: "Risk Assessment"
  },
  {
    id: "ID.BE-03",
    function: "IDENTIFY",
    category: "ID.BE – Business Environment",
    nist_id: "ID.BE-03",
    question: "Do you understand how your organization fits into the larger supply chain?",
    page: "Risk Assessment"
  },
  {
    id: "ID.BE-04",
    function: "IDENTIFY",
    category: "ID.BE – Business Environment",
    nist_id: "ID.BE-04",
    question: "Do you assess the potential impact of a cybersecurity event on your business?",
    page: "Risk Assessment"
  },
  {
    id: "ID.DP-01",
    function: "IDENTIFY",
    category: "ID.DP – Data Processing Ecosystem",
    nist_id: "ID.DP-01",
    question: "Do you know where your organization's data is stored and processed?",
    page: "Risk Assessment"
  },
  {
    id: "ID.DP-02",
    function: "IDENTIFY",
    category: "ID.DP – Data Processing Ecosystem",
    nist_id: "ID.DP-02",
    question: "Are data flows between systems and third parties documented?",
    page: "Risk Assessment"
  },
  {
    id: "ID.DP-03",
    function: "IDENTIFY",
    category: "ID.DP – Data Processing Ecosystem",
    nist_id: "ID.DP-03",
    question: "Are privacy and protection needs identified for each type of data?",
    page: "Risk Assessment"
  },
  {
    id: "ID.RA-01",
    function: "IDENTIFY",
    category: "ID.RA – Risk Assessment",
    nist_id: "ID.RA-01",
    question: "Do you regularly identify potential cybersecurity threats and vulnerabilities?",
    page: "Risk Assessment"
  },
  {
    id: "ID.RA-02",
    function: "IDENTIFY",
    category: "ID.RA – Risk Assessment",
    nist_id: "ID.RA-02",
    question: "Are risk assessments conducted for new systems or major changes?",
    page: "Risk Assessment"
  },
  {
    id: "ID.RA-03",
    function: "IDENTIFY",
    category: "ID.RA – Risk Assessment",
    nist_id: "ID.RA-03",
    question: "Do you assess the likelihood and impact of cybersecurity events?",
    page: "Risk Assessment"
  },
  {
    id: "ID.RA-04",
    function: "IDENTIFY",
    category: "ID.RA – Risk Assessment",
    nist_id: "ID.RA-04",
    question: "Are results from risk assessments shared with decision-makers?",
    page: "Risk Assessment"
  },
  {
    id: "ID.RA-05",
    function: "IDENTIFY",
    category: "ID.RA – Risk Assessment",
    nist_id: "ID.RA-05",
    question: "Do you update risk assessments when new threats emerge?",
    page: "Risk Assessment"
  },
  {
    id: "ID.IM-01",
    function: "IDENTIFY",
    category: "ID.IM – Improvement",
    nist_id: "ID.IM-01",
    question: "Do you have a process to improve your cybersecurity practices over time?",
    page: "Risk Assessment"
  },
  {
    id: "ID.IM-02",
    function: "IDENTIFY",
    category: "ID.IM – Improvement",
    nist_id: "ID.IM-02",
    question: "Are lessons learned from incidents used to refine policies and procedures?",
    page: "Risk Assessment"
  },
  {
    id: "ID.IM-03",
    function: "IDENTIFY",
    category: "ID.IM – Improvement",
    nist_id: "ID.IM-03",
    question: "Is there a mechanism to track and measure cybersecurity improvements?",
    page: "Risk Assessment"
  },
  // --- PROTECT (Evidence page) ---
  {
    id: "PR.AA-01",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-01",
    question: "Are all users uniquely identified and authenticated before accessing systems?",
    page: "Evidence"
  },
  {
    id: "PR.AA-02",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-02",
    question: "Are access rights based on roles and job responsibilities?",
    page: "Evidence"
  },
  {
    id: "PR.AA-03",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-03",
    question: "Are user privileges reviewed regularly?",
    page: "Evidence"
  },
  {
    id: "PR.AA-04",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-04",
    question: "Do you disable unused or inactive accounts promptly?",
    page: "Evidence"
  },
  {
    id: "PR.AA-05",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-05",
    question: "Do you use multi-factor authentication for critical systems?",
    page: "Evidence"
  },
  {
    id: "PR.AA-06",
    function: "PROTECT",
    category: "PR.AA – Identity Management & Access Control",
    nist_id: "PR.AA-06",
    question: "Are third-party access permissions controlled and monitored?",
    page: "Evidence"
  },
  {
    id: "PR.DS-01",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-01",
    question: "Is sensitive data classified (e.g., public, confidential, restricted)?",
    page: "Evidence"
  },
  {
    id: "PR.DS-02",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-02",
    question: "Is data protected while stored and transmitted?",
    page: "Evidence"
  },
  {
    id: "PR.DS-03",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-03",
    question: "Are encryption and access controls applied appropriately?",
    page: "Evidence"
  },
  {
    id: "PR.DS-04",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-04",
    question: "Are backups regularly created and tested?",
    page: "Evidence"
  },
  {
    id: "PR.DS-05",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-05",
    question: "Is removable media use controlled or restricted?",
    page: "Evidence"
  },
  {
    id: "PR.DS-06",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-06",
    question: "Are data retention and disposal policies defined?",
    page: "Evidence"
  },
  {
    id: "PR.DS-07",
    function: "PROTECT",
    category: "PR.DS – Data Security",
    nist_id: "PR.DS-07",
    question: "Are integrity checks in place to detect unauthorized data changes?",
    page: "Evidence"
  },
  {
    id: "PR.PS-01",
    function: "PROTECT",
    category: "PR.PS – Platform Security",
    nist_id: "PR.PS-01",
    question: "Are systems configured securely according to best practices?",
    page: "Evidence"
  },
  {
    id: "PR.PS-02",
    function: "PROTECT",
    category: "PR.PS – Platform Security",
    nist_id: "PR.PS-02",
    question: "Are operating systems and applications kept up to date with patches?",
    page: "Evidence"
  },
  {
    id: "PR.PS-03",
    function: "PROTECT",
    category: "PR.PS – Platform Security",
    nist_id: "PR.PS-03",
    question: "Are unauthorized changes or installations detected?",
    page: "Evidence"
  },
  {
    id: "PR.PS-04",
    function: "PROTECT",
    category: "PR.PS – Platform Security",
    nist_id: "PR.PS-04",
    question: "Are configurations reviewed periodically for compliance?",
    page: "Evidence"
  },
  {
    id: "PR.TV-01",
    function: "PROTECT",
    category: "PR.TV – Technology Infrastructure Resilience",
    nist_id: "PR.TV-01",
    question: "Are redundancy and failover measures in place for critical systems?",
    page: "Evidence"
  },
  {
    id: "PR.TV-02",
    function: "PROTECT",
    category: "PR.TV – Technology Infrastructure Resilience",
    nist_id: "PR.TV-02",
    question: "Are you able to maintain essential operations during disruptions?",
    page: "Evidence"
  },
  {
    id: "PR.TV-03",
    function: "PROTECT",
    category: "PR.TV – Technology Infrastructure Resilience",
    nist_id: "PR.TV-03",
    question: "Are resilience measures tested periodically?",
    page: "Evidence"
  },
  {
    id: "PR.TV-04",
    function: "PROTECT",
    category: "PR.TV – Technology Infrastructure Resilience",
    nist_id: "PR.TV-04",
    question: "Are lessons from past disruptions applied to strengthen resilience?",
    page: "Evidence"
  },
  {
    id: "PR.MA-01",
    function: "PROTECT",
    category: "PR.MA – Maintenance",
    nist_id: "PR.MA-01",
    question: "Are systems maintained and updated regularly?",
    page: "Evidence"
  },
  {
    id: "PR.MA-02",
    function: "PROTECT",
    category: "PR.MA – Maintenance",
    nist_id: "PR.MA-02",
    question: "Are maintenance activities authorized and logged?",
    page: "Evidence"
  },
  {
    id: "PR.MA-03",
    function: "PROTECT",
    category: "PR.MA – Maintenance",
    nist_id: "PR.MA-03",
    question: "Are remote maintenance sessions secured and monitored?",
    page: "Evidence"
  },
  {
    id: "PR.IR-01",
    function: "PROTECT",
    category: "PR.IR – Protective Technology",
    nist_id: "PR.IR-01",
    question: "Are protective tools (e.g., antivirus, firewalls, EDR) implemented and maintained?",
    page: "Evidence"
  },
  {
    id: "PR.IR-02",
    function: "PROTECT",
    category: "PR.IR – Protective Technology",
    nist_id: "PR.IR-02",
    question: "Are their configurations aligned with policies and requirements?",
    page: "Evidence"
  },
  {
    id: "PR.IR-03",
    function: "PROTECT",
    category: "PR.IR – Protective Technology",
    nist_id: "PR.IR-03",
    question: "Are security resources adequately supported and updated?",
    page: "Evidence"
  },
  // --- DETECT (Gap Analysis page) ---
  {
    id: "DE.AE-01",
    function: "DETECT",
    category: "DE.AE – Anomalies and Events",
    nist_id: "DE.AE-01",
    question: "Do you have defined baselines for normal system behavior?",
    page: "Gap Analysis"
  },
  {
    id: "DE.AE-02",
    function: "DETECT",
    category: "DE.AE – Anomalies and Events",
    nist_id: "DE.AE-02",
    question: "Are anomalies and security events detected in real-time?",
    page: "Gap Analysis"
  },
  {
    id: "DE.AE-03",
    function: "DETECT",
    category: "DE.AE – Anomalies and Events",
    nist_id: "DE.AE-03",
    question: "Are alerts investigated to determine their impact?",
    page: "Gap Analysis"
  },
  {
    id: "DE.AE-04",
    function: "DETECT",
    category: "DE.AE – Anomalies and Events",
    nist_id: "DE.AE-04",
    question: "Is data from multiple sources correlated for better detection?",
    page: "Gap Analysis"
  },
  {
    id: "DE.AE-05",
    function: "DETECT",
    category: "DE.AE – Anomalies and Events",
    nist_id: "DE.AE-05",
    question: "Are lessons from past events used to improve detection?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-01",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-01",
    question: "Are networks, systems, and users continuously monitored for threats?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-02",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-02",
    question: "Are monitoring tools properly configured and maintained?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-03",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-03",
    question: "Are alerts reviewed and escalated promptly?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-04",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-04",
    question: "Are logs collected, analyzed, and stored securely?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-05",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-05",
    question: "Are monitoring activities aligned with organizational risk tolerance?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-06",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-06",
    question: "Do you use threat intelligence to enhance monitoring?",
    page: "Gap Analysis"
  },
  {
    id: "DE.CM-07",
    function: "DETECT",
    category: "DE.CM – Security Continuous Monitoring",
    nist_id: "DE.CM-07",
    question: "Is third-party monitoring integrated into your program?",
    page: "Gap Analysis"
  },
  {
    id: "DE.DP-01",
    function: "DETECT",
    category: "DE.DP – Detection Processes",
    nist_id: "DE.DP-01",
    question: "Are detection processes documented and standardized?",
    page: "Gap Analysis"
  },
  {
    id: "DE.DP-02",
    function: "DETECT",
    category: "DE.DP – Detection Processes",
    nist_id: "DE.DP-02",
    question: "Are detection roles and responsibilities clearly defined?",
    page: "Gap Analysis"
  },
  {
    id: "DE.DP-03",
    function: "DETECT",
    category: "DE.DP – Detection Processes",
    nist_id: "DE.DP-03",
    question: "Are detection capabilities tested and improved over time?",
    page: "Gap Analysis"
  },
  {
    id: "DE.DP-04",
    function: "DETECT",
    category: "DE.DP – Detection Processes",
    nist_id: "DE.DP-04",
    question: "Are tools and processes reviewed after incidents?",
    page: "Gap Analysis"
  },
  // --- RESPOND & RECOVER (Improvement page) ---
  {
    id: "RS.MA-01",
    function: "RESPOND",
    category: "RS.MA – Incident Management",
    nist_id: "RS.MA-01",
    question: "Do you have a documented incident response plan?",
    page: "Improvement"
  },
  {
    id: "RS.MA-02",
    function: "RESPOND",
    category: "RS.MA – Incident Management",
    nist_id: "RS.MA-02",
    question: "Are roles and responsibilities clearly defined during incidents?",
    page: "Improvement"
  },
  {
    id: "RS.MA-03",
    function: "RESPOND",
    category: "RS.MA – Incident Management",
    nist_id: "RS.MA-03",
    question: "Are response procedures tested regularly (e.g., simulations)?",
    page: "Improvement"
  },
  {
    id: "RS.MA-04",
    function: "RESPOND",
    category: "RS.MA – Incident Management",
    nist_id: "RS.MA-04",
    question: "Are incidents prioritized based on impact and urgency?",
    page: "Improvement"
  },
  {
    id: "RS.MA-05",
    function: "RESPOND",
    category: "RS.MA – Incident Management",
    nist_id: "RS.MA-05",
    question: "Are response lessons learned captured and applied?",
    page: "Improvement"
  },
  {
    id: "RS.CO-01",
    function: "RESPOND",
    category: "RS.CO – Communications",
    nist_id: "RS.CO-01",
    question: "Do you have a communication plan for cybersecurity incidents?",
    page: "Improvement"
  },
  {
    id: "RS.CO-02",
    function: "RESPOND",
    category: "RS.CO – Communications",
    nist_id: "RS.CO-02",
    question: "Are internal and external communication channels defined?",
    page: "Improvement"
  },
  {
    id: "RS.CO-03",
    function: "RESPOND",
    category: "RS.CO – Communications",
    nist_id: "RS.CO-03",
    question: "Do you coordinate with external stakeholders (e.g., law enforcement)?",
    page: "Improvement"
  },
  {
    id: "RS.CO-04",
    function: "RESPOND",
    category: "RS.CO – Communications",
    nist_id: "RS.CO-04",
    question: "Are incident notifications sent according to legal requirements?",
    page: "Improvement"
  },
  {
    id: "RS.CO-05",
    function: "RESPOND",
    category: "RS.CO – Communications",
    nist_id: "RS.CO-05",
    question: "Are communication procedures updated after major incidents?",
    page: "Improvement"
  },
  {
    id: "RS.AN-01",
    function: "RESPOND",
    category: "RS.AN – Analysis",
    nist_id: "RS.AN-01",
    question: "Are incidents analyzed to determine their cause and scope?",
    page: "Improvement"
  },
  {
    id: "RS.AN-02",
    function: "RESPOND",
    category: "RS.AN – Analysis",
    nist_id: "RS.AN-02",
    question: "Is evidence properly collected and preserved?",
    page: "Improvement"
  },
  {
    id: "RS.AN-03",
    function: "RESPOND",
    category: "RS.AN – Analysis",
    nist_id: "RS.AN-03",
    question: "Are incident impacts assessed (e.g., data loss, downtime)?",
    page: "Improvement"
  },
  {
    id: "RS.AN-04",
    function: "RESPOND",
    category: "RS.AN – Analysis",
    nist_id: "RS.AN-04",
    question: "Are results of analysis shared with decision-makers?",
    page: "Improvement"
  },
  {
    id: "RS.IM-01",
    function: "RESPOND",
    category: "RS.IM – Mitigation",
    nist_id: "RS.IM-01",
    question: "Are containment and eradication actions taken quickly?",
    page: "Improvement"
  },
  {
    id: "RS.IM-02",
    function: "RESPOND",
    category: "RS.IM – Mitigation",
    nist_id: "RS.IM-02",
    question: "Are temporary fixes replaced with permanent solutions?",
    page: "Improvement"
  },
  {
    id: "RS.IM-03",
    function: "RESPOND",
    category: "RS.IM – Mitigation",
    nist_id: "RS.IM-03",
    question: "Is progress of mitigation tracked and reviewed?",
    page: "Improvement"
  },
  {
    id: "RS.IMV-01",
    function: "RESPOND",
    category: "RS.IMV – Improvements",
    nist_id: "RS.IMV-01",
    question: "Are incident response plans updated after each incident?",
    page: "Improvement"
  },
  {
    id: "RS.IMV-02",
    function: "RESPOND",
    category: "RS.IMV – Improvements",
    nist_id: "RS.IMV-02",
    question: "Are corrective actions implemented to prevent recurrence?",
    page: "Improvement"
  },
  {
    id: "RS.IMV-03",
    function: "RESPOND",
    category: "RS.IMV – Improvements",
    nist_id: "RS.IMV-03",
    question: "Are improvements communicated to all stakeholders?",
    page: "Improvement"
  },
  {
    id: "RC.MA-01",
    function: "RECOVER",
    category: "RC.MA – Incident Recovery Management",
    nist_id: "RC.MA-01",
    question: "Do you have a formal recovery plan for cyber incidents?",
    page: "Improvement"
  },
  {
    id: "RC.MA-02",
    function: "RECOVER",
    category: "RC.MA – Incident Recovery Management",
    nist_id: "RC.MA-02",
    question: "Are roles and responsibilities clear during recovery?",
    page: "Improvement"
  },
  {
    id: "RC.MA-03",
    function: "RECOVER",
    category: "RC.MA – Incident Recovery Management",
    nist_id: "RC.MA-03",
    question: "Are recovery steps tested and rehearsed?",
    page: "Improvement"
  },
  {
    id: "RC.MA-04",
    function: "RECOVER",
    category: "RC.MA – Incident Recovery Management",
    nist_id: "RC.MA-04",
    question: "Are recovery objectives (RTO/RPO) defined and achievable?",
    page: "Improvement"
  },
  {
    id: "RC.CO-01",
    function: "RECOVER",
    category: "RC.CO – Communications",
    nist_id: "RC.CO-01",
    question: "Is there a communication plan for recovery updates?",
    page: "Improvement"
  },
  {
    id: "RC.CO-02",
    function: "RECOVER",
    category: "RC.CO – Communications",
    nist_id: "RC.CO-02",
    question: "Are internal and external stakeholders kept informed during recovery?",
    page: "Improvement"
  },
  {
    id: "RC.CO-03",
    function: "RECOVER",
    category: "RC.CO – Communications",
    nist_id: "RC.CO-03",
    question: "Is communication managed to maintain trust and transparency?",
    page: "Improvement"
  },
  {
    id: "RC.IM-01",
    function: "RECOVER",
    category: "RC.IM – Improvements",
    nist_id: "RC.IM-01",
    question: "Are lessons from recovery efforts documented and applied?",
    page: "Improvement"
  },
  {
    id: "RC.IM-02",
    function: "RECOVER",
    category: "RC.IM – Improvements",
    nist_id: "RC.IM-02",
    question: "Are recovery plans updated after incidents?",
    page: "Improvement"
  },
  {
    id: "RC.IM-03",
    function: "RECOVER",
    category: "RC.IM – Improvements",
    nist_id: "RC.IM-03",
    question: "Are post-incident reports used to strengthen resilience?",
    page: "Improvement"
  }
];

// Helper function to get questions by function
export function getQuestionsByFunction(functionName: string): AssessmentQuestion[] {
  return nistQuestions.filter((q) => q.function === functionName);
}

// Helper function to get questions by page
export function getQuestionsByPage(pageName: string): AssessmentQuestion[] {
  return nistQuestions.filter((q) => q.page === pageName);
}

// Helper function to get question by NIST ID
export function getQuestionByNistId(nistId: string): AssessmentQuestion | undefined {
  return nistQuestions.find((q) => q.nist_id === nistId);
}
