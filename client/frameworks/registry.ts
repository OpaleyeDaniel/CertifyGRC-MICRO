import { ShieldAlert } from "lucide-react";
import type { FrameworkModule } from "./types";
import { nistCsfModule } from "./nist-csf/module";
import { iso27001Module } from "./iso27001/module";

/**
 * Omega Framework Registry
 * ---------------------------------
 * Frameworks are optional plugins: removing one means (1) delete its entry
 * and import from this array, (2) remove its `useSummary` / hook wiring in
 * `useFrameworkSummaries.ts`, and (3) delete its package under
 * `client/frameworks/<id>/` and pages. The platform shell (`FrameworkLayout`,
 * `FrameworkSidebar`, `App.tsx`) must not import that framework directly.
 *
 * The root shell reads ONLY from this registry. To add a new framework:
 *
 *   1. Drop its source into `frameworks/<NAME>/` at the repo root
 *      (or integrate its code into `client/frameworks/<id>/`).
 *   2. Create a `client/frameworks/<id>/module.ts` that exports a
 *      `FrameworkModule` implementing `types.ts`.
 *   3. Register it here.
 *
 * Everything else — sidebar entry, routing under `/frameworks/:id/*`,
 * dashboard aggregation, legacy redirects — is wired up automatically.
 */
export const REGISTERED_FRAMEWORKS: FrameworkModule[] = [
  nistCsfModule,
  iso27001Module,
  // Placeholders for upcoming frameworks. Only frameworks with
  // status "active" are mounted — anything else surfaces as a
  // "coming soon" card on the Frameworks hub without creating
  // broken routes or dead sidebar links.
  {
    id: "pcidss",
    name: "PCI DSS",
    tagline: "Payment Card Industry Data Security",
    description:
      "Requirements, compensating controls and evidence mapping for " +
      "PCI-DSS compliance programs.",
    icon: ShieldAlert,
    shortCode: "PC",
    filesystemPath: "frameworks/PCIDSS",
    status: "coming-soon",
    basePath: "/frameworks/pcidss",
    navigation: [],
  },
];

export const ACTIVE_FRAMEWORKS = REGISTERED_FRAMEWORKS.filter(
  (f) => f.status === "active",
);

export function getFrameworkById(id: string | undefined) {
  if (!id) return undefined;
  return REGISTERED_FRAMEWORKS.find((framework) => framework.id === id);
}

export function getFrameworkByPath(
  pathname: string,
): FrameworkModule | undefined {
  return REGISTERED_FRAMEWORKS.find(
    (f) =>
      pathname === f.basePath || pathname.startsWith(`${f.basePath}/`),
  );
}
