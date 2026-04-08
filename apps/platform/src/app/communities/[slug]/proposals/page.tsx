import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  discussion: { label: "Discussion", color: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  voting: { label: "Voting", color: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  approved: { label: "Approved", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  building: { label: "Building", color: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  deployed: { label: "Deployed", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  merged: { label: "Merged", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  rolled_back: { label: "Rolled back", color: "bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

const TYPE_LABELS: Record<string, string> = {
  flag_test: "Flag test",
  branch_test: "Branch test",
  governance_vote: "Governance vote",
};

export default async function ProposalsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, title, proposal_type, status, created_at, author_id")
    .eq("community_id", community.id)
    .order("created_at", { ascending: false });

  // Get author names
  const authorIds = [...new Set(proposals?.map((p) => p.author_id) ?? [])];
  const { data: authors } = authorIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds)
    : { data: [] };

  const authorMap = new Map(authors?.map((a) => [a.id, a.display_name]) ?? []);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/communities/${slug}`}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              &larr; {community.name}
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
          </div>
          <Link
            href={`/communities/${slug}/proposals/new`}
            className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            New proposal
          </Link>
        </div>

        {proposals && proposals.length > 0 ? (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const statusInfo = STATUS_LABELS[proposal.status] ?? {
                label: proposal.status,
                color: "bg-zinc-50 text-zinc-700",
              };
              return (
                <Link
                  key={proposal.id}
                  href={`/communities/${slug}/proposals/${proposal.id}`}
                  className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{proposal.title}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {TYPE_LABELS[proposal.proposal_type] ?? proposal.proposal_type}
                        {" by "}
                        {authorMap.get(proposal.author_id) ?? "Unknown"}
                        {" \u00b7 "}
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No proposals yet. Be the first to propose a feature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
