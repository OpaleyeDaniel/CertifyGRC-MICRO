import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { FloatingChatBot } from "../FloatingChatBot";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
      <FloatingChatBot />
    </div>
  );
}
