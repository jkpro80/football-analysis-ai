import type { Metadata } from "next";
import AppLayout from "@/components/layout/AppLayout";
import HomeDashboard from "@/components/home/HomeDashboard";
import { getDashboardData } from "@/lib/dashboard";


export const metadata: Metadata = {
  title: "Football Predictions & Match Analysis",
  description:
    "MÅLX provides football predictions, match analysis, probabilities, statistics, fixtures and data-driven insights.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MÅLX",
    title: "Football Predictions & Match Analysis",
    description:
      "MÅLX provides football predictions, match analysis, probabilities, statistics, fixtures and data-driven insights.",
  },
  twitter: {
    card: "summary",
    title: "Football Predictions & Match Analysis",
    description:
      "MÅLX provides football predictions, match analysis, probabilities, statistics, fixtures and data-driven insights.",
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const {
    fixtures,
    explorerFixtures,
    modelVersion,
    matchStats,
    upcomingHasMore,
    upcomingNextOffset,
  } = await getDashboardData();

  return (
    <AppLayout>
      <HomeDashboard
        fixtures={fixtures}
        explorerFixtures={explorerFixtures}
        modelVersion={modelVersion}
        matchStats={matchStats}
        upcomingHasMore={upcomingHasMore}
        upcomingNextOffset={upcomingNextOffset}
      />
    </AppLayout>
  );
}

