import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/userManagement";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (t: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(t: ThemePreference) {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  const isDark = t === "dark" || (t === "system" && prefersDark);

  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t: ThemePreference) => {
    localStorage.setItem(STORAGE_KEYS.THEME, t);
    setThemeState(t);
    applyTheme(t);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

