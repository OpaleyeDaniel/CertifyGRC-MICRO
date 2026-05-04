import { useState } from "react";
import { Header } from "./Header";
import { FrameworkSidebar } from "./FrameworkSidebar";
import { FloatingChatBot } from "../FloatingChatBot";
import type { FrameworkModule } from "@/frameworks/types";

interface FrameworkLayoutProps {
  framework: FrameworkModule;
  children: React.ReactNode;
}

/**
 * FrameworkLayout
 * ---------------
 * Layout used EXCLUSIVELY by framework workspace routes
 * (`/frameworks/<id>/…`). It renders the framework's dedicated sidebar
 * and nothing from the general Omega navigation.
 *
 * This is the mechanism that guarantees framework workspaces never
 * visually mix with the general app shell, and that all in-workspace
 * links stay scoped to the framework.
 */
export function FrameworkLayout({ framework, children }: FrameworkLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col" data-framework={framework.id}>
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <FrameworkSidebar
          framework={framework}
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
