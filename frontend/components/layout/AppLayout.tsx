"use client";

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-slate-100"
    >
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}