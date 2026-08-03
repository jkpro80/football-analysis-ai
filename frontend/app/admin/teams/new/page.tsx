import TeamForm from "@/components/TeamForm";

export default function NewTeamPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white p-10"
    >
      <h1 className="mb-8 text-4xl font-black">
        إضافة فريق جديد
      </h1>

      <TeamForm />
    </main>
  );
}