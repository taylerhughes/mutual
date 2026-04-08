import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Fetch user's active stakes with community info
  const { data: stakes } = await supabase
    .from("stakes")
    .select("id, status, joined_at, community_id")
    .eq("member_id", user!.id)
    .eq("status", "active");

  // Fetch community details for each stake
  const communityIds = stakes?.map((s) => s.community_id) ?? [];
  const { data: communities } = communityIds.length > 0
    ? await supabase
        .from("communities")
        .select("id, name, slug, description, voting_model")
        .in("id", communityIds)
    : { data: [] };

  // Fetch all active communities for the discover section
  const { data: allCommunities } = await supabase
    .from("communities")
    .select("id, name, slug, description, entry_stake_amount, currency")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const memberCommunityIds = new Set(communityIds);
  const discoverCommunities = allCommunities?.filter(
    (c) => !memberCommunityIds.has(c.id),
  );

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Your communities and governance activity
          </p>
        </div>

        {/* User's communities */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Your communities</h2>
          {communities && communities.length > 0 ? (
            <div className="space-y-3">
              {communities.map((community) => {
                const stake = stakes?.find(
                  (s) => s.community_id === community.id,
                );
                return (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{community.name}</p>
                        {community.description && (
                          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {community.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                          Member
                        </span>
                        {stake?.joined_at && (
                          <p className="mt-1 text-xs text-zinc-400">
                            Joined{" "}
                            {new Date(stake.joined_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-200 p-6 text-center dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You haven&apos;t joined any communities yet.
              </p>
            </div>
          )}
        </section>

        {/* Discover communities */}
        {discoverCommunities && discoverCommunities.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Discover</h2>
            <div className="space-y-3">
              {discoverCommunities.map((community) => {
                const formattedPrice = new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency: community.currency,
                }).format(community.entry_stake_amount / 100);
                return (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{community.name}</p>
                        {community.description && (
                          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {community.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formattedPrice}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
