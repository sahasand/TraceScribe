"use client";

import { User } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6">
          <div />
          {/* Mock user for local testing */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Test User</span>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
