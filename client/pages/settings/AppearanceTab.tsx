import React, { useMemo, useState } from "react";
import { useTheme } from "@/context/ThemeContext";

const OPTIONS = [
  {
    key: "light",
    label: "Light",
    desc: "Clean white interface",
  },
  {
    key: "dark",
    label: "Dark",
    desc: "Easy on the eyes",
  },
  {
    key: "system",
    label: "System default",
    desc: "Follows your OS setting",
  },
] as const;

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const [selected, setSelected] = useState<(typeof OPTIONS)[number]["key"]>(theme);

  const preview = useMemo(() => {
    // Use CSS variables only; the preview will still look native in whichever mode
    // is currently applied, which is fine for selection UI.
    return (
      <div style={{ display: "flex", gap: 6, height: 70, overflow: "hidden" }}>
        <div style={{ width: 48, background: "var(--bg-tertiary)", borderRadius: 4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 8, background: "var(--border-medium)", borderRadius: 2, marginBottom: 6 }} />
          <div style={{ height: 8, background: "var(--border-medium)", borderRadius: 2, width: "60%", marginBottom: 6 }} />
          <div style={{ height: 22, background: "var(--color-info-bg)", borderRadius: 4, width: "70%" }} />
        </div>
      </div>
    );
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 4px", color: "var(--text-primary)" }}>
        Appearance
      </h2>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 24px" }}>
        Choose how CertifyGRC looks for you
      </p>

      <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 12px", color: "var(--text-primary)" }}>
        Theme
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <div
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                flex: 1,
                cursor: "pointer",
                padding: 16,
                borderRadius: 10,
                border: isSelected ? "2px solid var(--color-info-text)" : "0.5px solid var(--border-subtle)",
                background: isSelected ? "var(--color-info-bg)" : "var(--bg-secondary)",
                transition: "border 0.15s, background 0.15s",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    background: isSelected ? "var(--bg-primary)" : "transparent",
                    borderRadius: 6,
                    border: "0.5px solid var(--border-subtle)",
                    padding: 10,
                    overflow: "hidden",
                    height: 70,
                    boxSizing: "border-box",
                  }}
                >
                  {preview}
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  margin: "0 0 2px",
                  color: isSelected ? "var(--color-info-text)" : "var(--text-primary)",
                }}
              >
                {opt.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  margin: 0,
                  color: isSelected ? "var(--color-info-text)" : "var(--text-secondary)",
                  opacity: 0.85,
                }}
              >
                {opt.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={() => setTheme(selected)}>
          Save preference
        </button>
      </div>
    </div>
  );
}

