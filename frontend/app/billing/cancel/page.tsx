import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold mb-3">
          Payment cancelled
        </h1>

        <p className="text-base opacity-80 mb-6">
          No changes were made to your subscription.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold border"
        >
          Back to Football Analysis AI
        </Link>
      </div>
    </main>
  );
}
