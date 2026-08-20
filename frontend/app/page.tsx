import AppLayout from "@/components/layout/AppLayout";
import HomeDashboard from "@/components/home/HomeDashboard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const {
    fixtures,
    explorerFixtures,
    modelVersion,
  } = await getDashboardData();

  return (
    <AppLayout>
      <HomeDashboard
        fixtures={fixtures}
        explorerFixtures={explorerFixtures}
        modelVersion={modelVersion}
      />
    </AppLayout>
  );
}

