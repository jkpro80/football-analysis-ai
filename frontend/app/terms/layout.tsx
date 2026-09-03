import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Read the MÅLX terms and conditions governing use of the football analysis, statistics and prediction platform.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    type: "website",
    url: "/terms",
    siteName: "MÅLX",
    title: "Terms & Conditions",
    description:
      "Read the MÅLX terms and conditions governing use of the football analysis, statistics and prediction platform.",
  },
  twitter: {
    card: "summary",
    title: "Terms & Conditions",
    description:
      "Read the MÅLX terms and conditions governing use of the football analysis, statistics and prediction platform.",
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
