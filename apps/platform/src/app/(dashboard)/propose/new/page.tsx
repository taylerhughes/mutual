import Link from "next/link";
import { createSoftware } from "@/app/actions/propose";

export default async function CreateSoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Create software
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Describe the software you want to build. You&apos;ll be the
            founding member and can start building immediately.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form action={createSoftware} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Civic Planning Tools"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium leading-none"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              placeholder="What does this software do? Who is it for?"
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90"
            >
              Create
            </button>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-6 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
