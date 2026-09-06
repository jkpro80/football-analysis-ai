"use client";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import BackButton from "@/components/BackButton";

export default function GlobalBackButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedReturnHref =
    pathname.startsWith("/matches/")
      ? searchParams.get("returnTo")
      : null;

  const safeReturnHref =
    requestedReturnHref &&
    requestedReturnHref.startsWith("/") &&
    !requestedReturnHref.startsWith("//")
      ? requestedReturnHref
      : undefined;

  const hidden =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin");

  if (hidden) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl px-4 pt-4 sm:px-6">
      <BackButton
        fallbackHref={safeReturnHref ?? "/"}
        preferredHref={safeReturnHref}
        className="shrink-0"
      />
    </div>
  );
}
