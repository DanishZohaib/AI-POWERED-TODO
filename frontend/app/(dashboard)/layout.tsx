"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI-Powered Workflow & Task Tracking System v1.0.0</span>
          <span>Enterprise Team Workspace • Audit Logging Active</span>
        </div>
      </footer>
    </div>
  );
}
