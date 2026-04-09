import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DirectoryPage() {
  const supabase = await createClient();

  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, slug, description, entry_stake_amount, currency")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Get member counts
  const memberCounts = new Map<string, number>();
  if (communities && communities.length > 0) {
    for (const c of communities) {
      const { count } = await supabase
        .from("stakes")
        .select("id", { count: "exact", head: true })
        .eq("community_id", c.id)
        .eq("status", "active");
      memberCounts.set(c.id, count ?? 0);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Directory</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Browse software built and governed by communities
            </p>
          </div>
          <Link
            href="/propose/new"
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Create software
          </Link>
        </div>

        {communities && communities.length > 0 ? (
          <div className="space-y-3">
            {communities.map((community) => {
              const members = memberCounts.get(community.id) ?? 0;
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{community.name}</p>
                      {community.description && (
                        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {community.description}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-sm text-zinc-500 dark:text-zinc-400">
                      <p>
                        {members} {members === 1 ? "member" : "members"}
                      </p>
                      <p>{formattedPrice}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No software yet. Be the first to create something.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
