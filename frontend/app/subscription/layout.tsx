import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MÅLX Subscription Plans",
  description:
    "Compare MÅLX Free, Pro and Premium subscription plans and choose the football analysis features that fit your needs.",
  alternates: {
    canonical: "/subscription",
  },
  openGraph: {
    type: "website",
    url: "/subscription",
    siteName: "MÅLX",
    title: "MÅLX Subscription Plans",
    description:
      "Compare MÅLX Free, Pro and Premium subscription plans and choose the football analysis features that fit your needs.",
  },
  twitter: {
    card: "summary",
    title: "MÅLX Subscription Plans",
    description:
      "Compare MÅLX Free, Pro and Premium subscription plans and choose the football analysis features that fit your needs.",
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
