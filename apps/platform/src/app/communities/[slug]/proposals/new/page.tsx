import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProposal } from "@/app/actions/proposals";
import { SubmitButton } from "@/components/submit-button";

export default async function NewProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug, founding_member_id")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  // Verify user is a member (via stake or as founding member of draft community)
  const { data: stake } = await supabase
    .from("stakes")
    .select("id")
    .eq("member_id", user.id)
    .eq("community_id", community.id)
    .eq("status", "active")
    .maybeSingle();

  const isFounder = user.id === community.founding_member_id;
  const isMember = !!stake || isFounder;

  if (!isMember) {
    redirect(`/communities/${slug}?error=You+must+be+a+member+to+create+proposals`);
  }

  // Check member count for auto-approve messaging
  const { count: stakeCount } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", community.id)
    .eq("status", "active");

  // Founder of a draft community counts as a member even without a stake
  const founderExtra = isFounder && !stake ? 1 : 0;
  const isSolo = (stakeCount ?? 0) + founderExtra <= 1;

  const createProposalForCommunity = createProposal.bind(null, slug);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <Link
            href={`/communities/${slug}/proposals`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to proposals
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">New proposal</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isSolo
              ? `As the sole member, your proposal will be approved immediately.`
              : `Propose a change to ${community.name}. Your proposal will start in the discussion phase for community deliberation.`}
          </p>
        </div>

        <form action={createProposalForCommunity} className="space-y-6">
          <input type="hidden" name="community_id" value={community.id} />

          <div className="space-y-2">
            <label
              htmlFor="title"
              className="text-sm font-medium leading-none"
            >
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="What do you want to propose?"
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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              What problem does this solve? What are the tradeoffs? Who is
              affected?
            </p>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder="Describe your proposal in detail..."
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="proposal_type"
              className="text-sm font-medium leading-none"
            >
              Proposal type
            </label>
            <select
              id="proposal_type"
              name="proposal_type"
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-100"
            >
              <option value="flag_test">
                Flag test &mdash; small, non-destructive change tested behind a
                flag
              </option>
              <option value="branch_test">
                Branch test &mdash; significant structural change tested in a
                parallel branch
              </option>
              <option value="governance_vote">
                Governance vote &mdash; major decision requiring formal
                community vote
              </option>
            </select>
          </div>

          <div className="flex gap-3">
            <SubmitButton
              pendingText="Submitting..."
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Submit proposal
            </SubmitButton>
            <Link
              href={`/communities/${slug}/proposals`}
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
