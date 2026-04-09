import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { purchaseStake } from "@/app/actions/stakes";
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

  // Check if current user already has a stake
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

  // Count active members
  const { count: memberCount } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", community.id)
    .eq("status", "active");

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: community.currency,
  }).format(community.entry_stake_amount / 100);

  // Fetch recent proposals (for members only)
  let recentProposals: { id: string; title: string; status: string }[] = [];
  if (existingStake) {
    const { data } = await supabase
      .from("proposals")
      .select("id, title, status")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentProposals = data ?? [];
  }

  const purchaseStakeWithId = purchaseStake.bind(null, community.id);

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
            <p className="text-2xl font-semibold">{memberCount ?? 0}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Entry stake
            </p>
            <p className="text-2xl font-semibold">{formattedPrice}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Voting model
            </p>
            <p className="text-2xl font-semibold capitalize">
              {community.voting_model.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          {existingStake ? (
            <div className="space-y-4 text-center">
              <p className="font-medium text-green-700 dark:text-green-400">
                You are a member of this community
              </p>
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
                <InviteButton communityId={community.id} communitySlug={slug} />
              </div>
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
        {existingStake && recentProposals.length > 0 && (
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
