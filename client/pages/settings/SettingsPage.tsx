import React, { useEffect, useState } from "react";
import { AccountTab } from "./AccountTab";
import { UsersTab } from "./UsersTab";
import { AppearanceTab } from "./AppearanceTab";
import { ConnectedAppsSettings } from "./ConnectedAppsSettings";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { key: "account", label: "Account" },
  { key: "users", label: "Users & permissions" },
  { key: "integrations", label: "Connected apps" },
  { key: "appearance", label: "Appearance" },
] as const;

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("users");

  useEffect(() => {
    const tab = params.get("tab");
    if (tab === "account" || tab === "users" || tab === "appearance" || tab === "integrations") {
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
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background md:flex-row">
      <aside className="w-full shrink-0 border-b border-border bg-sidebar md:w-64 md:border-b-0 md:border-r">
        <nav className="flex flex-col gap-0.5 p-4">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
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
                  "rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === "account" && <AccountTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "integrations" && <ConnectedAppsSettings />}
        {activeTab === "appearance" && <AppearanceTab />}
      </div>
    </div>
  );
}

