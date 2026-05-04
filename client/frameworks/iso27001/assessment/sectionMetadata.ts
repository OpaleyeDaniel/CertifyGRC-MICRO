/**
 * Display titles and short descriptions for ISO 27001 clause sub-references,
 * aligned with the standard’s clause headings for a premium overview UI.
 */
export const ISO_SUBSECTION_COPY: Record<string, { title: string; description: string }> = {
  "4.1": {
    title: "Understanding the organization and its context",
    description:
      "Identify internal and external issues that affect the ISMS and keep context documented and reviewed.",
  },
  "4.2": {
    title: "Understanding the needs and expectations of interested parties",
    description:
      "Determine interested parties and their requirements, including legal, regulatory and contractual obligations.",
  },
  "4.3": {
    title: "Determining the scope of the information security management system",
    description:
      "Define ISMS boundaries, interfaces, exclusions and how scope is approved and maintained.",
  },
  "4.4": {
    title: "Information security management system",
    description:
      "Establish, implement, maintain and continually improve the ISMS in accordance with ISO 27001.",
  },
  "5.1": {
    title: "Leadership and commitment",
    description: "Top management demonstrates accountability and commitment to the ISMS.",
  },
  "5.2": {
    title: "Information security policy",
    description: "An appropriate policy is established, communicated and reviewed at planned intervals.",
  },
  "5.3": {
    title: "Organizational roles, responsibilities and authorities",
    description: "Roles and responsibilities for information security are assigned and communicated.",
  },
  "6.1.1": {
    title: "General — planning for the ISMS",
    description: "Plan actions to address risks and opportunities for the ISMS.",
  },
  "6.1.2": {
    title: "Information security risk assessment",
    description: "Define criteria, perform assessments and retain documented information.",
  },
  "6.1.3": {
    title: "Information security risk treatment",
    description: "Select and implement treatment options and link to the Statement of Applicability.",
  },
  "6.2": {
    title: "Information security objectives",
    description: "Set measurable objectives aligned to the policy and monitor achievement.",
  },
  "6.3": {
    title: "Planning of changes",
    description: "Plan changes to the ISMS in a systematic way when needed.",
  },
  "7.1": {
    title: "Resources",
    description: "Determine and provide resources needed for the ISMS.",
  },
  "7.2": {
    title: "Competence",
    description: "Ensure personnel are competent on the basis of education, training or experience.",
  },
  "7.3": {
    title: "Awareness",
    description: "Personnel understand their contribution and the implications of nonconformity.",
  },
  "7.4": {
    title: "Communication",
    description: "Plan internal and external communications relevant to the ISMS.",
  },
  "7.5.1": {
    title: "General — documented information",
    description: "Create and update documented information to the extent needed.",
  },
  "7.5.2": {
    title: "Creating and updating documented information",
    description: "Control identification, format, review and approval of documented information.",
  },
  "7.5.3": {
    title: "Control of documented information",
    description: "Make documented information available, protected and retained as required.",
  },
  "8.1": {
    title: "Operational planning and control",
    description: "Plan, implement and control processes to meet requirements and implement risk treatment.",
  },
  "8.2": {
    title: "Information security risk assessment",
    description: "Perform risk assessments at planned intervals or when significant changes occur.",
  },
  "8.3": {
    title: "Information security risk treatment",
    description: "Implement the risk treatment plan and retain evidence of results.",
  },
  "9.1": {
    title: "Monitoring, measurement, analysis and evaluation",
    description: "Evaluate performance and effectiveness of the ISMS using appropriate methods.",
  },
  "9.2": {
    title: "Internal audit",
    description: "Plan, establish, implement and maintain an audit programme at planned intervals.",
  },
  "9.3": {
    title: "Management review",
    description: "Top management reviews the ISMS at planned intervals with defined inputs and outputs.",
  },
  "10.1": {
    title: "Continual improvement",
    description: "Improve the suitability, adequacy and effectiveness of the ISMS.",
  },
  "10.2": {
    title: "Nonconformity and corrective action",
    description: "React to nonconformities, take action, eliminate causes and update the ISMS.",
  },
};

export function getClauseSubsectionLabel(reference: string, fallbackTitle?: string): { title: string; description: string } {
  const copy = ISO_SUBSECTION_COPY[reference];
  if (copy) return copy;
  return {
    title: fallbackTitle ?? `Section ${reference}`,
    description: "Complete the assessment questions for this subsection.",
  };
}
