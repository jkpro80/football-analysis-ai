"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { useLocale } from "@/context/locale-context";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const { direction } = useLocale();
  const pathname = usePathname();

  const [isMobileNavigationOpen, setIsMobileNavigationOpen] =
    useState(false);

  useEffect(() => {
    setIsMobileNavigationOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileNavigationOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavigationOpen]);

  return (
    <div
      dir={direction}
      className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100"
    >
      <div className="flex min-h-screen">
        <Sidebar />

        {isMobileNavigationOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() =>
                setIsMobileNavigationOpen(false)
              }
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            />

            <div
              className={[
                "absolute inset-y-0 w-[min(88vw,320px)]",
                direction === "rtl"
                  ? "right-0"
                  : "left-0",
              ].join(" ")}
            >
              <Sidebar mobile />
            </div>
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <Topbar
            onOpenMobileNavigation={() =>
              setIsMobileNavigationOpen(true)
            }
          />

          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
