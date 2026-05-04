import { Lock } from "lucide-react";
import type { FrameworkModule } from "@/frameworks/types";
import { iso27001Navigation } from "./navigation";
import Iso27001Routes from "./Iso27001Routes";
import { useIso27001NavBadges, useIso27001Summary } from "./useIso27001Summary";

/**
 * ISO 27001:2022 — framework module manifest.
 *
 * The Omega shell discovers this module through
 * `client/frameworks/registry.ts`. Everything ISO-27001 specific
 * (data, hooks, pages, routes, summary, navigation) lives under
 * `client/frameworks/iso27001` and `client/pages/frameworks/iso27001`
 * so the workspace stays self-contained.
 *
 * Workflow shape (clauses 4–10, Annex A control themes, risk treatment, evidence,
 * performance evaluation, improvement) follows publicly described ISO/IEC 27001 ISMS
 * expectations; authoritative requirements remain with ISO and accredited auditors.
 */
export const iso27001Module: FrameworkModule = {
  id: "iso27001",
  name: "ISO 27001",
  tagline: "Information Security Management",
  description:
    "Full ISMS workspace for ISO/IEC 27001:2022 — clause assessment (4–10), Annex A control catalogue, Statement of Applicability, risk assessment & treatment, evidence management, internal audit, management review, corrective action and certification readiness.",
  icon: Lock,
  shortCode: "IS",
  version: "2022",
  filesystemPath: "frameworks/ISO27001",
  status: "active",
  basePath: "/frameworks/iso27001",
  navigation: iso27001Navigation,
  Routes: Iso27001Routes,
  useSummary: useIso27001Summary,
  useNavBadges: useIso27001NavBadges,
  legacyRedirects: [],
};
