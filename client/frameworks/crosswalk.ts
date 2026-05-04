/**
 * Omega Framework Crosswalk Dataset
 *
 * A static, editable mapping between controls across frameworks.
 * This dataset is intentionally exhaustive-ish for NIST CSF 2.0 —
 * the most commonly mapped sub-categories to ISO/IEC 27001:2022
 * Annex A and PCI DSS v4.0. When a framework is added to the
 * platform, append its mappings here (or move to a server-owned
 * dataset later — the shape is deliberately simple JSON).
 *
 * Mapping strengths:
 *   - "equivalent"   : controls satisfy each other directly
 *   - "partial"      : significant overlap, still needs local evidence
 *   - "supports"     : one provides supporting evidence for the other
 */

export type CrosswalkStrength = "equivalent" | "partial" | "supports";

export interface CrosswalkEntry {
  from: { frameworkId: string; controlId: string; title?: string };
  to: { frameworkId: string; controlId: string; title?: string };
  strength: CrosswalkStrength;
  note?: string;
}

export const CROSSWALK: CrosswalkEntry[] = [
  /* -------- NIST CSF 2.0 → ISO/IEC 27001:2022 -------- */
  { from: { frameworkId: "nist-csf", controlId: "GV.OC-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.1" }, strength: "equivalent", note: "Organizational context / policies for information security." },
  { from: { frameworkId: "nist-csf", controlId: "GV.OC-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.31" }, strength: "equivalent", note: "Legal, statutory, regulatory and contractual requirements." },
  { from: { frameworkId: "nist-csf", controlId: "GV.RM-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.4" }, strength: "equivalent", note: "Management direction for information security." },
  { from: { frameworkId: "nist-csf", controlId: "GV.RR-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.2" }, strength: "equivalent", note: "Roles and responsibilities." },
  { from: { frameworkId: "nist-csf", controlId: "GV.PO-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.1" }, strength: "partial" },
  { from: { frameworkId: "nist-csf", controlId: "GV.OT-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.19" }, strength: "equivalent", note: "Information security in supplier relationships." },
  { from: { frameworkId: "nist-csf", controlId: "GV.OT-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.20" }, strength: "equivalent" },
  { from: { frameworkId: "nist-csf", controlId: "GV.OT-03" }, to: { frameworkId: "iso-27001", controlId: "A.5.22" }, strength: "partial" },
  { from: { frameworkId: "nist-csf", controlId: "ID.AM-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.9" }, strength: "equivalent", note: "Inventory of information and other associated assets." },
  { from: { frameworkId: "nist-csf", controlId: "ID.AM-03" }, to: { frameworkId: "iso-27001", controlId: "A.5.10" }, strength: "partial", note: "Acceptable use / ownership of assets." },
  { from: { frameworkId: "nist-csf", controlId: "ID.RA-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.7" }, strength: "equivalent", note: "Threat intelligence." },
  { from: { frameworkId: "nist-csf", controlId: "ID.RA-02" }, to: { frameworkId: "iso-27001", controlId: "A.8.8" }, strength: "partial", note: "Management of technical vulnerabilities." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.15" }, strength: "equivalent", note: "Access control policy." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.16" }, strength: "equivalent", note: "Identity management." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-03" }, to: { frameworkId: "iso-27001", controlId: "A.5.17" }, strength: "equivalent", note: "Authentication information." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-05" }, to: { frameworkId: "iso-27001", controlId: "A.5.18" }, strength: "equivalent", note: "Access rights." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-01" }, to: { frameworkId: "iso-27001", controlId: "A.8.12" }, strength: "equivalent", note: "Data leakage prevention." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-02" }, to: { frameworkId: "iso-27001", controlId: "A.8.24" }, strength: "equivalent", note: "Use of cryptography." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-10" }, to: { frameworkId: "iso-27001", controlId: "A.8.13" }, strength: "equivalent", note: "Information backup." },
  { from: { frameworkId: "nist-csf", controlId: "PR.PS-01" }, to: { frameworkId: "iso-27001", controlId: "A.8.9" }, strength: "equivalent", note: "Configuration management." },
  { from: { frameworkId: "nist-csf", controlId: "PR.PS-02" }, to: { frameworkId: "iso-27001", controlId: "A.8.19" }, strength: "partial", note: "Installation of software on operational systems." },
  { from: { frameworkId: "nist-csf", controlId: "PR.IR-01" }, to: { frameworkId: "iso-27001", controlId: "A.8.20" }, strength: "equivalent", note: "Network security." },
  { from: { frameworkId: "nist-csf", controlId: "PR.IR-02" }, to: { frameworkId: "iso-27001", controlId: "A.7.4" }, strength: "partial", note: "Physical security monitoring." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-01" }, to: { frameworkId: "iso-27001", controlId: "A.8.16" }, strength: "equivalent", note: "Monitoring activities." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-03" }, to: { frameworkId: "iso-27001", controlId: "A.8.15" }, strength: "equivalent", note: "Logging." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-06" }, to: { frameworkId: "iso-27001", controlId: "A.5.22" }, strength: "partial" },
  { from: { frameworkId: "nist-csf", controlId: "RS.MA-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.24" }, strength: "equivalent", note: "Information security incident management planning." },
  { from: { frameworkId: "nist-csf", controlId: "RS.MA-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.25" }, strength: "equivalent" },
  { from: { frameworkId: "nist-csf", controlId: "RS.AN-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.26" }, strength: "equivalent" },
  { from: { frameworkId: "nist-csf", controlId: "RS.CO-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.27" }, strength: "equivalent" },
  { from: { frameworkId: "nist-csf", controlId: "RC.RP-01" }, to: { frameworkId: "iso-27001", controlId: "A.5.29" }, strength: "equivalent", note: "Information security during disruption." },
  { from: { frameworkId: "nist-csf", controlId: "RC.RP-02" }, to: { frameworkId: "iso-27001", controlId: "A.5.30" }, strength: "partial", note: "ICT readiness for business continuity." },

  /* -------- NIST CSF 2.0 → PCI DSS v4.0 -------- */
  { from: { frameworkId: "nist-csf", controlId: "GV.PO-01" }, to: { frameworkId: "pci-dss", controlId: "12.1" }, strength: "equivalent", note: "Information security policy." },
  { from: { frameworkId: "nist-csf", controlId: "GV.RR-01" }, to: { frameworkId: "pci-dss", controlId: "12.4" }, strength: "equivalent", note: "Security responsibilities / governance." },
  { from: { frameworkId: "nist-csf", controlId: "GV.OT-01" }, to: { frameworkId: "pci-dss", controlId: "12.8" }, strength: "equivalent", note: "Third-party service providers." },
  { from: { frameworkId: "nist-csf", controlId: "ID.AM-01" }, to: { frameworkId: "pci-dss", controlId: "12.5.1" }, strength: "partial", note: "Inventory of system components in the CDE." },
  { from: { frameworkId: "nist-csf", controlId: "ID.RA-01" }, to: { frameworkId: "pci-dss", controlId: "6.3" }, strength: "partial", note: "Security vulnerabilities identified and addressed." },
  { from: { frameworkId: "nist-csf", controlId: "ID.RA-02" }, to: { frameworkId: "pci-dss", controlId: "11.3" }, strength: "partial", note: "External and internal vulnerability scans." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-01" }, to: { frameworkId: "pci-dss", controlId: "7.1" }, strength: "equivalent", note: "Restrict access by business need to know." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-02" }, to: { frameworkId: "pci-dss", controlId: "8.2" }, strength: "equivalent", note: "User identification." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-03" }, to: { frameworkId: "pci-dss", controlId: "8.3" }, strength: "equivalent", note: "Strong authentication." },
  { from: { frameworkId: "nist-csf", controlId: "PR.AA-05" }, to: { frameworkId: "pci-dss", controlId: "7.2" }, strength: "equivalent", note: "Access rights." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-02" }, to: { frameworkId: "pci-dss", controlId: "3.5" }, strength: "equivalent", note: "Protect stored account data with cryptography." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-02" }, to: { frameworkId: "pci-dss", controlId: "4.2" }, strength: "equivalent", note: "Protect PAN during transmission." },
  { from: { frameworkId: "nist-csf", controlId: "PR.DS-10" }, to: { frameworkId: "pci-dss", controlId: "12.10.5" }, strength: "partial", note: "Back up critical systems and data." },
  { from: { frameworkId: "nist-csf", controlId: "PR.PS-01" }, to: { frameworkId: "pci-dss", controlId: "2.2" }, strength: "equivalent", note: "Secure configuration of system components." },
  { from: { frameworkId: "nist-csf", controlId: "PR.PS-02" }, to: { frameworkId: "pci-dss", controlId: "6.3.3" }, strength: "partial", note: "Apply vendor-supplied security patches." },
  { from: { frameworkId: "nist-csf", controlId: "PR.IR-01" }, to: { frameworkId: "pci-dss", controlId: "1.2" }, strength: "equivalent", note: "Network security controls." },
  { from: { frameworkId: "nist-csf", controlId: "PR.IR-01" }, to: { frameworkId: "pci-dss", controlId: "1.3" }, strength: "equivalent", note: "Segment the CDE from untrusted networks." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-01" }, to: { frameworkId: "pci-dss", controlId: "11.4" }, strength: "partial", note: "Intrusion detection/prevention." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-03" }, to: { frameworkId: "pci-dss", controlId: "10.2" }, strength: "equivalent", note: "Logs for all system components." },
  { from: { frameworkId: "nist-csf", controlId: "DE.CM-06" }, to: { frameworkId: "pci-dss", controlId: "12.8.4" }, strength: "partial", note: "Monitor third-party compliance." },
  { from: { frameworkId: "nist-csf", controlId: "RS.MA-01" }, to: { frameworkId: "pci-dss", controlId: "12.10" }, strength: "equivalent", note: "Incident response plan." },
  { from: { frameworkId: "nist-csf", controlId: "RS.MA-02" }, to: { frameworkId: "pci-dss", controlId: "12.10.2" }, strength: "equivalent" },
  { from: { frameworkId: "nist-csf", controlId: "RC.RP-01" }, to: { frameworkId: "pci-dss", controlId: "12.10.4" }, strength: "equivalent" },

  /* -------- ISO/IEC 27001:2022 → PCI DSS v4.0 -------- */
  { from: { frameworkId: "iso-27001", controlId: "A.5.1" },  to: { frameworkId: "pci-dss", controlId: "12.1" },    strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.5.15" }, to: { frameworkId: "pci-dss", controlId: "7.1" },     strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.5.17" }, to: { frameworkId: "pci-dss", controlId: "8.3" },     strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.8.15" }, to: { frameworkId: "pci-dss", controlId: "10.2" },    strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.8.20" }, to: { frameworkId: "pci-dss", controlId: "1.2" },     strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.8.24" }, to: { frameworkId: "pci-dss", controlId: "3.5" },     strength: "equivalent" },
  { from: { frameworkId: "iso-27001", controlId: "A.5.24" }, to: { frameworkId: "pci-dss", controlId: "12.10" },   strength: "equivalent" },
];

/** Return all crosswalk edges that include a given control, in either direction. */
export function getCrosswalkFor(
  frameworkId: string,
  controlId: string,
): CrosswalkEntry[] {
  return CROSSWALK.filter(
    (entry) =>
      (entry.from.frameworkId === frameworkId &&
        entry.from.controlId === controlId) ||
      (entry.to.frameworkId === frameworkId &&
        entry.to.controlId === controlId),
  );
}

/** Unique pairs of frameworks that have at least one mapping edge. */
export function getMappedFrameworkPairs(): Array<[string, string]> {
  const set = new Set<string>();
  CROSSWALK.forEach((entry) => {
    const a = entry.from.frameworkId;
    const b = entry.to.frameworkId;
    const key = [a, b].sort().join("::");
    set.add(key);
  });
  return Array.from(set).map((k) => k.split("::") as [string, string]);
}

/** Aggregate counts of mappings between every pair of frameworks. */
export function buildOverlapMatrix(frameworkIds: string[]) {
  const matrix: Record<string, Record<string, number>> = {};
  frameworkIds.forEach((a) => {
    matrix[a] = {};
    frameworkIds.forEach((b) => {
      matrix[a][b] = 0;
    });
  });
  CROSSWALK.forEach((entry) => {
    const a = entry.from.frameworkId;
    const b = entry.to.frameworkId;
    if (matrix[a] && b in matrix[a]) matrix[a][b] += 1;
    if (matrix[b] && a in matrix[b] && a !== b) matrix[b][a] += 1;
  });
  return matrix;
}
