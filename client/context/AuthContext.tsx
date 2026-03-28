import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AppUser,
  createUserId,
  defaultAdmin,
  PERMISSION_TEMPLATES,
  safeParseJSON,
  STORAGE_KEYS,
  type PermissionAction,
  type Permissions,
  type Role,
} from "@/lib/userManagement";
import { useNavigate } from "react-router-dom";

type AuthContextValue = {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => { success: true } | { success: false; error: string };
  logout: () => void;
  updateCurrentUser: (updatedFields: Partial<AppUser>) => void;
  hasPermission: (page: keyof Permissions, action?: PermissionAction) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function seedDefaultAdminIfNeeded() {
  const stored = localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT);
  const users = safeParseJSON<AppUser[]>(stored, []);

  if (!stored || !Array.isArray(users) || users.length === 0) {
    // Ensure each seed uses a fresh copy of the permission object
    localStorage.setItem(STORAGE_KEYS.USER_MANAGEMENT, JSON.stringify([{ ...defaultAdmin, permissions: { ...PERMISSION_TEMPLATES.admin } }]));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDefaultAdminIfNeeded();

    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (session) {
      const parsed = safeParseJSON<AppUser | null>(session, null);
      setCurrentUser(parsed);
    }
    setLoading(false);
  }, []);

  const login: AuthContextValue["login"] = (email, password) => {
    const users = safeParseJSON<AppUser[]>(localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT), []);

    const match = users.find(
      (u) => u.email === email && u.password === password && u.isActive === true
    );

    if (match) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(match));
      setCurrentUser(match);
      return { success: true } as const;
    }

    return { success: false, error: "Invalid email or password" } as const;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    setCurrentUser(null);
  };

  const updateCurrentUser: AuthContextValue["updateCurrentUser"] = (updatedFields) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated: AppUser = {
        ...prev,
        ...updatedFields,
        permissions: updatedFields.permissions ?? prev.permissions,
      };

      // Also update in the users array
      const users = safeParseJSON<AppUser[]>(localStorage.getItem(STORAGE_KEYS.USER_MANAGEMENT), []);
      const index = users.findIndex((u) => u.id === updated.id);
      if (index !== -1) {
        users[index] = updated;
        localStorage.setItem(STORAGE_KEYS.USER_MANAGEMENT, JSON.stringify(users));
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      return updated;
    });
  };

  const hasPermission: AuthContextValue["hasPermission"] = (page, action = "view") => {
    if (!currentUser) return false;
    return currentUser.permissions?.[page]?.[action] === true;
  };

  const value = useMemo<AuthContextValue>(
    () => ({ currentUser, loading, login, logout, updateCurrentUser, hasPermission }),
    [currentUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Helper component for legacy navigation usage (optional)
export function RequireAuthNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  useEffect(() => {
    if (!loading && !currentUser) navigate("/login", { replace: true });
  }, [currentUser, loading, navigate]);
  return <>{children}</>;
}

