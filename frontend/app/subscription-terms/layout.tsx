import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Subscription & Cancellation Terms",
  description:
    "Read the MÅLX subscription, billing, renewal and cancellation terms for paid plans and digital services.",
  alternates: {
    canonical: "/subscription-terms",
  },
  openGraph: {
    type: "website",
    url: "/subscription-terms",
    siteName: "MÅLX",
    title: "Subscription & Cancellation Terms",
    description:
      "Read the MÅLX subscription, billing, renewal and cancellation terms for paid plans and digital services.",
  },
  twitter: {
    card: "summary",
    title: "Subscription & Cancellation Terms",
    description:
      "Read the MÅLX subscription, billing, renewal and cancellation terms for paid plans and digital services.",
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
