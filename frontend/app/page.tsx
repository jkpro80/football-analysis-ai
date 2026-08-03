import AppLayout from "@/components/layout/AppLayout";
import HomeDashboard from "@/components/home/HomeDashboard";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { fixtures, modelVersion } =
    await getDashboardData();

  return (
    <AppLayout>
      <HomeDashboard
        fixtures={fixtures}
        modelVersion={modelVersion}
      />
    </AppLayout>
  );
}
