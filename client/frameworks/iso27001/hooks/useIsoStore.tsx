import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_ORG_PROFILE,
  type OrganisationProfile,
  type Applicability,
  type ImplementationStatus,
} from "../data/types";

/**
 * The ISO 27001 workspace keeps all its state in a single localStorage
 * key so exports / resets / cross-page updates stay consistent. A thin
 * React context wraps this state so hooks can subscribe to slices.
 */
export const ISO_WORKSPACE_STORAGE_KEY = "iso27001_workspace_state_v1";
const STORAGE_KEY = ISO_WORKSPACE_STORAGE_KEY;

export type ReviewStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "changes-requested"
  | "approved"
  | "rejected"
  | "closed";

export interface QuestionState {
  answer?: string | null;
  maturity?: number | null;
  status?: ImplementationStatus;
  owner?: string;
  notes?: string;
  justification?: string;
  evidence?: EvidenceItemRef[];
  reviewerComment?: string;
  reviewStatus?: ReviewStatus;
  updatedAt?: string;
}

export interface EvidenceItemRef {
  evidenceId: string; // references EvidenceFile.id
  label?: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  uploadedAt: string;
  owner?: string;
  reviewStatus?: "unreviewed" | "accepted" | "rejected";
  expiryDate?: string;
  linkedQuestions: string[];
  linkedControls: string[];
  linkedRisks: string[];
  notes?: string;
  /** Data URL kept in localStorage when small enough; otherwise name-only. */
  dataUrl?: string;
  sourceKind?: "local" | "cloud";
  storageMode?: "import" | "link";
  sourceProviderId?: string;
  externalFileId?: string;
  externalPath?: string;
  accessState?: "available" | "imported_copy" | "link_may_be_invalid";
  attachedByLabel?: string;
}

export interface SoAEntry {
  controlRef: string;
  applicability: Applicability;
  justification?: string;
  status: ImplementationStatus;
  owner?: string;
  linkedPolicies?: string[];
  linkedRisks?: string[];
  linkedProcedures?: string[];
  comments?: string;
  reviewStatus: ReviewStatus;
  approvedAt?: string;
  approvedBy?: string;
  updatedAt: string;
}

export interface RiskEntry {
  id: string;
  title: string;
  description?: string;
  asset?: string;
  threat?: string;
  vulnerability?: string;
  likelihood: number; // 1..5
  impact: number; // 1..5
  inherentScore: number; // likelihood*impact
  existingControls?: string;
  residualLikelihood: number;
  residualImpact: number;
  residualScore: number;
  owner?: string;
  treatment: "mitigate" | "transfer" | "avoid" | "accept" | "none";
  treatmentPlan?: string;
  targetDate?: string;
  status: "open" | "in-progress" | "treated" | "accepted" | "closed";
  linkedControls: string[]; // Annex A refs
  linkedClauseQuestions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentAction {
  id: string;
  riskId: string;
  title: string;
  description?: string;
  owner?: string;
  targetDate?: string;
  status: "pending" | "in-progress" | "done" | "blocked";
  linkedControls: string[];
  residualUpdate?: { likelihood: number; impact: number };
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  source: "internal-audit" | "management-review" | "incident" | "self-identified" | "external-audit";
  title: string;
  description?: string;
  severity: "critical" | "major" | "minor" | "observation" | "opportunity";
  owner?: string;
  clauseRef?: string;
  controlRef?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  targetDate?: string;
  status: "open" | "in-progress" | "verified" | "closed";
  closureEvidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternalAudit {
  id: string;
  title: string;
  scope: string;
  criteria: string;
  auditor: string;
  independence?: string;
  plannedDate: string;
  completedDate?: string;
  status: "planned" | "in-progress" | "reported" | "closed";
  checklist: string[]; // clause/control refs
  findings: string[]; // finding ids
  reportNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagementReview {
  id: string;
  date: string;
  participants: string[];
  inputs: {
    previousActionsStatus?: string;
    contextChanges?: string;
    performanceTrends?: string;
    incidents?: string;
    risks?: string;
    improvementOpportunities?: string;
    stakeholderFeedback?: string;
  };
  outputs: {
    decisions?: string;
    actions?: string;
    resourceNeeds?: string;
  };
  approvedBy?: string;
  status: "draft" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  scope: "workspace" | "clause" | "control" | "question" | "evidence" | "report";
  targetId: string;
  author: string;
  text: string;
  mentions?: string[];
  resolved?: boolean;
  createdAt: string;
}

export interface WizardProgress {
  currentStep: number;
  lastSavedAt: string;
  stepCompletion: Record<string, boolean>;
}

export interface IsoState {
  organisation: OrganisationProfile;
  questions: Record<string, QuestionState>;
  evidenceFiles: EvidenceFile[];
  soa: Record<string, SoAEntry>;
  risks: RiskEntry[];
  treatmentActions: TreatmentAction[];
  findings: Finding[];
  internalAudits: InternalAudit[];
  managementReviews: ManagementReview[];
  comments: Comment[];
  wizard: WizardProgress;
  settings: {
    riskScaleMax: number;
    acceptanceThreshold: number; // residual score <= this auto-accept allowed
  };
  createdAt: string;
  updatedAt: string;
}

const EMPTY_STATE: IsoState = {
  organisation: { ...DEFAULT_ORG_PROFILE },
  questions: {},
  evidenceFiles: [],
  soa: {},
  risks: [],
  treatmentActions: [],
  findings: [],
  internalAudits: [],
  managementReviews: [],
  comments: [],
  wizard: { currentStep: 0, lastSavedAt: new Date().toISOString(), stepCompletion: {} },
  settings: { riskScaleMax: 5, acceptanceThreshold: 6 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function loadState(): IsoState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_STATE, ...parsed };
  } catch (err) {
    console.warn("[iso27001] failed to parse state — resetting", err);
    return EMPTY_STATE;
  }
}

function persistState(state: IsoState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("iso27001StateChanged"));
  } catch (err) {
    console.warn("[iso27001] failed to persist state", err);
  }
}

type Updater = (prev: IsoState) => IsoState;

interface IsoStoreContext {
  state: IsoState;
  update: (updater: Updater) => void;
  reset: () => void;
}

const Ctx = createContext<IsoStoreContext | null>(null);

export function IsoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IsoState>(() => loadState());

  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    const onExternal = () => {
      const next = loadState();
      setState(next);
    };
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY) onExternal();
    });
    return () => {
      // cleanup handled by window listener signature
    };
  }, []);

  const update = useCallback((updater: Updater) => {
    setState((prev) => {
      const next = updater(prev);
      next.updatedAt = new Date().toISOString();
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const cleared = { ...EMPTY_STATE, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setState(cleared);
  }, []);

  const ctxValue = useMemo<IsoStoreContext>(
    () => ({ state, update, reset }),
    [state, update, reset],
  );

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
}

export function useIsoStore() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // When used outside the provider (e.g. Omega global pages), return a
    // read-only snapshot from localStorage so aggregation hooks keep
    // working without a live subscription.
    const snapshot = loadState();
    return {
      state: snapshot,
      update: () => {
        console.warn("[iso27001] useIsoStore.update called outside of IsoStoreProvider — ignored");
      },
      reset: () => {},
    } satisfies IsoStoreContext;
  }
  return ctx;
}

export function getIsoStateSnapshot(): IsoState {
  return loadState();
}

/**
 * Subscribe to persisted ISO workspace JSON (same-tab via `iso27001StateChanged`,
 * other tabs via `storage`). Used by Omega summary / nav badges without importing
 * framework internals into the root shell.
 */
export function useIsoWorkspaceStorageSnapshot(): string {
  return useSyncExternalStore(
    (onChange) => {
      const bump = () => onChange();
      window.addEventListener("iso27001StateChanged", bump);
      const onStorage = (e: StorageEvent) => {
        if (e.key === ISO_WORKSPACE_STORAGE_KEY) bump();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener("iso27001StateChanged", bump);
        window.removeEventListener("storage", onStorage);
      };
    },
    () => {
      try {
        return localStorage.getItem(ISO_WORKSPACE_STORAGE_KEY) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
}

/* ----------------- helpers ----------------- */

export function nowIso() {
  return new Date().toISOString();
}

export function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}
