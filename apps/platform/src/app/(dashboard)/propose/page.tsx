import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProposePage() {
  const supabase = await createClient();

  // Fetch all proposed communities
  const { data: proposals } = await supabase
    .from("communities")
    .select("id, name, slug, description, cosigner_threshold, founding_member_id, created_at")
    .eq("status", "proposed")
    .order("created_at", { ascending: false });

  // Get co-signature counts
  const proposalIds = proposals?.map((p) => p.id) ?? [];
  const cosignCounts = new Map<string, number>();

  if (proposalIds.length > 0) {
    for (const id of proposalIds) {
      const { count } = await supabase
        .from("co_signatures")
        .select("id", { count: "exact", head: true })
        .eq("community_id", id);
      cosignCounts.set(id, count ?? 0);
    }
  }

  // Get proposer names
  const founderIds = [...new Set(proposals?.map((p) => p.founding_member_id) ?? [])];
  const { data: founders } = founderIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", founderIds)
    : { data: [] };

  const founderMap = new Map(founders?.map((f) => [f.id, f.display_name]) ?? []);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Propose software
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Submit software ideas and co-sign proposals you believe in
            </p>
          </div>
          <Link
            href="/propose/new"
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Propose new software
          </Link>
        </div>

        {proposals && proposals.length > 0 ? (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const count = cosignCounts.get(proposal.id) ?? 0;
              const progress = Math.min(
                100,
                Math.round((count / proposal.cosigner_threshold) * 100),
              );

              return (
                <Link
                  key={proposal.id}
                  href={`/propose/${proposal.slug}`}
                  className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">{proposal.name}</p>
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                          Proposed by{" "}
                          {founderMap.get(proposal.founding_member_id) ??
                            "Unknown"}
                          {" \u00b7 "}
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">
                        {count}/{proposal.cosigner_threshold} co-signers
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No proposals yet. Be the first to propose software your community
              needs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
