import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { purchaseStake } from "@/app/actions/stakes";
import { publishSoftware } from "@/app/actions/propose";
import { InviteButton } from "@/components/invite-button";
import { SubmitButton } from "@/components/submit-button";

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; cancelled?: string }>;
}) {
  const { slug } = await params;
  const { error, cancelled } = await searchParams;

  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isFounder = user?.id === community.founding_member_id;
  const isDraft = community.status === "draft";

  // Draft communities are only visible to the founder
  if (isDraft && !isFounder) {
    notFound();
  }

  // Check if current user has a stake (for active communities)
  let existingStake = null;
  if (user) {
    const { data } = await supabase
      .from("stakes")
      .select("id, status")
      .eq("member_id", user.id)
      .eq("community_id", community.id)
      .eq("status", "active")
      .maybeSingle();
    existingStake = data;
  }

  // Founder of a draft community is a member even without a stake
  const isMember = !!existingStake || (isDraft && isFounder);

  // Count active members (stakes) — founders of drafts don't have one yet
  const { count: stakeCount } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", community.id)
    .eq("status", "active");

  const memberCount = (stakeCount ?? 0) + (isDraft && isFounder ? 1 : 0);

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: community.currency,
  }).format(community.entry_stake_amount / 100);

  // Fetch recent proposals (for members only)
  let recentProposals: { id: string; title: string; status: string }[] = [];
  if (isMember) {
    const { data } = await supabase
      .from("proposals")
      .select("id, title, status")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentProposals = data ?? [];
  }

  const purchaseStakeWithId = purchaseStake.bind(null, community.id);
  const publishBound = publishSoftware.bind(null, community.id, slug);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {cancelled && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Checkout was cancelled. You can try again when you&apos;re ready.
          </div>
        )}

        {/* Draft banner */}
        {isDraft && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This software is in draft mode
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Only you can see this. When you&apos;re ready, publish it to make
              it visible in the directory and allow others to join.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {community.name}
          </h1>
          {community.description && (
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {community.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Members</p>
            <p className="text-2xl font-semibold">{memberCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Entry stake
            </p>
            <p className="text-2xl font-semibold">{formattedPrice}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Status</p>
            <p className="text-2xl font-semibold capitalize">
              {community.status}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          {isMember ? (
            <div className="space-y-4 text-center">
              {isDraft ? (
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  You are the founder &mdash; build your software, then publish
                  when ready
                </p>
              ) : (
                <p className="font-medium text-green-700 dark:text-green-400">
                  You are a member of this community
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/communities/${slug}/proposals`}
                  className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90"
                >
                  View proposals
                </Link>
                <Link
                  href={`/communities/${slug}/proposals/new`}
                  className="inline-flex h-9 items-center rounded-md border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  New proposal
                </Link>
                {!isDraft && (
                  <InviteButton
                    communityId={community.id}
                    communitySlug={slug}
                  />
                )}
              </div>
              {isDraft && isFounder && (
                <form action={publishBound} className="mt-4">
                  <SubmitButton
                    pendingText="Publishing..."
                    className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-6 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    Publish to directory
                  </SubmitButton>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    This will make your software visible to everyone and create
                    your founding stake ({formattedPrice}).
                  </p>
                </form>
              )}
            </div>
          ) : user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Acquire a stake to become a member and gain governance rights.
                Your stake persists indefinitely and confers voting rights.
              </p>
              <form action={purchaseStakeWithId}>
                <SubmitButton
                  pendingText="Redirecting to checkout..."
                  className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  Acquire stake &mdash; {formattedPrice}
                </SubmitButton>
              </form>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sign in to acquire a stake and join this community.
              </p>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90"
              >
                Sign in to join
              </Link>
            </div>
          )}
        </div>

        {/* Recent proposals for members */}
        {isMember && recentProposals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent proposals</h2>
              <Link
                href={`/communities/${slug}/proposals`}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                View all &rarr;
              </Link>
            </div>
            {recentProposals.map((p) => (
              <Link
                key={p.id}
                href={`/communities/${slug}/proposals/${p.id}`}
                className="block rounded-lg border border-zinc-200 p-3 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
              >
                <span className="font-medium">{p.title}</span>
                <span className="ml-2 text-xs text-zinc-500 capitalize">
                  {p.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
