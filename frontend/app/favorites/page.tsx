import FavoritesClient from "@/components/favorites/FavoritesClient";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const { fixtures, modelVersion } =
    await getDashboardData();

  return (
    <FavoritesClient
      fixtures={fixtures}
      modelVersion={modelVersion}
    />
  );
}
