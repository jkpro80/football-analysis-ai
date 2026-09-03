import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Read the MÅLX cookie policy and learn how cookies, local storage and related technologies may be used on the platform.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    type: "website",
    url: "/cookies",
    siteName: "MÅLX",
    title: "Cookie Policy",
    description:
      "Read the MÅLX cookie policy and learn how cookies, local storage and related technologies may be used on the platform.",
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy",
    description:
      "Read the MÅLX cookie policy and learn how cookies, local storage and related technologies may be used on the platform.",
  },
};

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({
  children,
}: LayoutProps) {
  return children;
}
