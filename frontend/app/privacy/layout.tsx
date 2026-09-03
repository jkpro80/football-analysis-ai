import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the MÅLX privacy policy and learn how MALX LTD handles personal data, accounts, subscriptions and platform usage.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    url: "/privacy",
    siteName: "MÅLX",
    title: "Privacy Policy",
    description:
      "Read the MÅLX privacy policy and learn how MALX LTD handles personal data, accounts, subscriptions and platform usage.",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy",
    description:
      "Read the MÅLX privacy policy and learn how MALX LTD handles personal data, accounts, subscriptions and platform usage.",
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
