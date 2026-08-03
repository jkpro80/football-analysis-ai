import MatchForm from "@/components/MatchForm";

export default function NewMatchPage() {
  return (
    <main dir="rtl" className="min-h-screen p-10">
      <h1 className="mb-8 text-4xl font-black">
        إضافة مباراة جديدة
      </h1>

      <MatchForm />
    </main>
  );
}