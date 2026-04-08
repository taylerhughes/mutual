import Link from "next/link";
import { createSoftwareProposal } from "@/app/actions/propose";

export default async function NewProposePage({
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
            href="/propose"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to proposals
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            Propose new software
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Describe the software your community needs. Others will co-sign to
            signal demand. When enough people back it, the community is created
            and you become its founding member.
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <form action={createSoftwareProposal} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">
              Project name
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

          {/* What it does */}
          <div className="space-y-2">
            <label
              htmlFor="what_it_does"
              className="text-sm font-medium leading-none"
            >
              What does this software do?
            </label>
            <textarea
              id="what_it_does"
              name="what_it_does"
              required
              rows={3}
              placeholder="Describe the software and its core functionality..."
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Who it serves */}
          <div className="space-y-2">
            <label
              htmlFor="who_it_serves"
              className="text-sm font-medium leading-none"
            >
              Who does it serve?
            </label>
            <textarea
              id="who_it_serves"
              name="who_it_serves"
              required
              rows={3}
              placeholder="Describe the community or group of people who need this..."
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Why needed */}
          <div className="space-y-2">
            <label
              htmlFor="why_needed"
              className="text-sm font-medium leading-none"
            >
              Why don&apos;t existing solutions work?
            </label>
            <textarea
              id="why_needed"
              name="why_needed"
              required
              rows={3}
              placeholder="What's missing from current options? Why does this need to exist?"
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Governance settings */}
          <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold">Governance settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="voting_model"
                  className="text-sm font-medium leading-none"
                >
                  Voting model
                </label>
                <select
                  id="voting_model"
                  name="voting_model"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-100"
                >
                  <option value="flat">Flat (one member, one vote)</option>
                  <option value="contribution_weighted">
                    Contribution-weighted
                  </option>
                  <option value="quadratic">Quadratic</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="entry_stake_amount"
                  className="text-sm font-medium leading-none"
                >
                  Entry stake (&pound;)
                </label>
                <input
                  id="entry_stake_amount"
                  name="entry_stake_amount"
                  type="number"
                  min="1"
                  step="0.50"
                  defaultValue="15"
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="cosigner_threshold"
                className="text-sm font-medium leading-none"
              >
                Co-signers needed to create community
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Minimum 2. You count as the first co-signer.
              </p>
              <input
                id="cosigner_threshold"
                name="cosigner_threshold"
                type="number"
                min="2"
                max="100"
                defaultValue="5"
                className="flex h-10 w-full max-w-[120px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-100"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90"
            >
              Submit proposal
            </button>
            <Link
              href="/propose"
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
