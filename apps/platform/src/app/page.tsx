import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <main className="flex max-w-lg flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Mutual</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Software is infrastructure. Own it. Govern it. Together.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Get started
          </Link>
        </div>
      </main>
    </div>
  );
}
