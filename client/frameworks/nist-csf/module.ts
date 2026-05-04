import { ShieldCheck } from "lucide-react";
import type { FrameworkModule } from "@/frameworks/types";
import { nistCsfNavigation } from "./navigation";
import NistCsfRoutes from "./NistCsfRoutes";
import { useNistSummary } from "./useNistSummary";
import { useNistNavBadges } from "./useNistNavBadges";

/**
 * NIST Cybersecurity Framework 2.0 — framework module manifest.
 *
 * This object is the single source of truth the Omega shell uses to
 * surface NIST-CSF in the sidebar, dashboard and router.
 * Adding a new framework follows the exact same pattern (see
 * `client/frameworks/registry.ts`).
 *
 * The original, self-contained framework source lives in
 * `frameworks/NIST CSF 2.0/` at the repository root. This manifest
 * bridges that source into the live platform by re-using the
 * `client/` pages/hooks/components, which are the integrated copy of
 * the framework.
 */
export const nistCsfModule: FrameworkModule = {
  id: "nist-csf",
  name: "NIST CSF 2.0",
  tagline: "Cybersecurity Framework 2.0",
  description:
    "Functions, categories and subcategories with maturity scoring, gap " +
    "remediation, risk assessment, evidence, reviews and continuous " +
    "improvement across the full control lifecycle.",
  icon: ShieldCheck,
  shortCode: "NC",
  version: "2.0",
  filesystemPath: "frameworks/NIST CSF 2.0",
  status: "active",
  basePath: "/frameworks/nist-csf",
  navigation: nistCsfNavigation,
  Routes: NistCsfRoutes,
  useSummary: useNistSummary,
  useNavBadges: useNistNavBadges,
  /**
   * Important: we intentionally DO NOT claim /assessment, /gap-analysis,
   * /risk, /evidence, /report, /review, /improvement from the root —
   * those are now Omega GLOBAL pages that aggregate across every
   * framework. Deep links to NIST-specific workflows live under
   * /frameworks/nist-csf/... .
   */
  legacyRedirects: [],
};
