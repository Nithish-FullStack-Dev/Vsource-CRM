// app/(dashboard)/layout.tsx

"use client";

import { Sidebar } from "./layouts/Sidebar";
import { Topbar } from "./layouts/Topbar";
import { useAuth, useUi } from "@/store";
import RouteGuard from "@/components/guards/RouteGuard";
import { SocketProvider } from "@/components/providers/socket-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUi();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <RouteGuard>
        <Sidebar />

        <div
          className={`transition-all duration-300 ${
            sidebarCollapsed ? "md:ml-18" : "md:ml-63"
          }`}
        >
          <Topbar />
          <SocketProvider authenticated={Boolean(user)}>
            <main className="min-h-[calc(100vh-64px)] overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </SocketProvider>
        </div>
      </RouteGuard>
    </div>
  );
}
