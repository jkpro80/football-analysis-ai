import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PredictionPage({
  params,
}: PageProps) {
  const { id } = await params;

  redirect(`/matches/${encodeURIComponent(id)}`);
}
