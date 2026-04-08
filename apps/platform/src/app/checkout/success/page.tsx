import Link from "next/link";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to the community
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Your stake has been acquired. You are now a member with full
            governance rights.
          </p>
        </div>

        {session_id && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Session: {session_id}
          </p>
        )}

        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
