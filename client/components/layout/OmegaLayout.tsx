import { useState } from "react";
import { Header } from "./Header";
import { OmegaSidebar } from "./OmegaSidebar";
import { FloatingChatBot } from "../FloatingChatBot";

interface OmegaLayoutProps {
  children: React.ReactNode;
}

/**
 * OmegaLayout
 * -----------
 * Layout for the GENERAL / ROOT Omega app (every route NOT under a
 * framework workspace). Renders the Omega (cross-framework) sidebar
 * exclusively.
 *
 * Used by all `/`, `/dashboard`, `/frameworks`, `/assessment`,
 * `/gap-analysis`, `/risk`, `/evidence`, `/report`, `/review`,
 * `/improvement`, `/cross-mapping`, `/audit-readiness`,
 * `/notifications`, `/settings`, `/profile` routes.
 */
export function OmegaLayout({ children }: OmegaLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <OmegaSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="min-h-full">{children}</div>
        </main>
      </div>
      <FloatingChatBot />
    </div>
  );
}
