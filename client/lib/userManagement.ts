export type Role = "admin" | "auditor" | "implementer";
export type PermissionAction = "view" | "edit";

export type PagePermission = {
  view: boolean;
  edit: boolean;
};

export type Permissions = {
  assessment: PagePermission;
  gapAnalysis: PagePermission;
  riskAssessment: PagePermission;
  evidence: PagePermission;
  report: PagePermission;
  review: PagePermission;
  improvement: PagePermission;
};

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  title: string;
  password: string;
  avatar: string | null;
  isActive: boolean;
  role: Role;
  permissions: Permissions;
};

export const STORAGE_KEYS = {
  USER_MANAGEMENT: "user_management_data",
  CURRENT_USER: "current_user",
  THEME: "theme_preference",
} as const;

export const PERMISSION_TEMPLATES: Record<Role, Permissions> = {
  admin: {
    assessment: { view: true, edit: true },
    gapAnalysis: { view: true, edit: true },
    riskAssessment: { view: true, edit: true },
    evidence: { view: true, edit: true },
    report: { view: true, edit: true },
    review: { view: true, edit: true },
    improvement: { view: true, edit: true },
  },
  auditor: {
    assessment: { view: false, edit: false },
    gapAnalysis: { view: false, edit: false },
    riskAssessment: { view: true, edit: false },
    evidence: { view: true, edit: false },
    report: { view: false, edit: false },
    review: { view: true, edit: true },
    improvement: { view: false, edit: false },
  },
  implementer: {
    assessment: { view: true, edit: true },
    gapAnalysis: { view: true, edit: true },
    riskAssessment: { view: true, edit: false },
    evidence: { view: true, edit: true },
    report: { view: true, edit: false },
    review: { view: true, edit: false },
    improvement: { view: true, edit: true },
  },
};

export const defaultAdmin: AppUser = {
  id: "admin-001",
  fullName: "Admin",
  email: "admin@certifygrc.com",
  title: "System Administrator",
  password: "Admin@123",
  avatar: null,
  isActive: true,
  role: "admin",
  permissions: PERMISSION_TEMPLATES.admin,
};

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w?.[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function createUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `user_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

