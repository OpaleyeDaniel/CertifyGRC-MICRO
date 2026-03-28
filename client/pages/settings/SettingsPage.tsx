import React, { useEffect, useState } from "react";
import { AccountTab } from "./AccountTab";
import { UsersTab } from "./UsersTab";
import { AppearanceTab } from "./AppearanceTab";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { key: "account", label: "Account" },
  { key: "users", label: "Users & permissions" },
  { key: "appearance", label: "Appearance" },
] as const;

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("users");

  useEffect(() => {
    const tab = params.get("tab");
    if (tab === "account" || tab === "users" || tab === "appearance") {
      setActiveTab(tab);
    }
  }, [params]);

  const handleTabChange = (tab: (typeof TABS)[number]["key"]) => {
    setActiveTab(tab);
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next, { replace: true });
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Settings sidebar */}
      <div
        className="w-64 flex-shrink-0 border-r border-border bg-sidebar overflow-hidden"
      >
        <nav className="flex flex-col p-4 gap-2">
          <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-0 py-2">
            Settings
          </div>

          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {activeTab === "account" && <AccountTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "appearance" && <AppearanceTab />}
      </div>
    </div>
  );
}

