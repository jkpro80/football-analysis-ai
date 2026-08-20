"use client";

import { usePathname } from "next/navigation";

import BackButton from "@/components/BackButton";

export default function GlobalBackButton() {
  const pathname = usePathname();

  const hidden =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/matches/") ||
    /^\/teams\/\d+$/.test(pathname);

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed left-4 top-20 z-50 sm:left-6">
      <BackButton
        fallbackHref="/"
        className="shadow-lg shadow-black/20 backdrop-blur"
      />
    </div>
  );
}


