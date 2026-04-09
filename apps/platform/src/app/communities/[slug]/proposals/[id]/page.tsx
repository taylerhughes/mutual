import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { moveToVoting, castVote, addComment } from "@/app/actions/proposals";
import { SubmitButton } from "@/components/submit-button";

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

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  // Get author profile
  const { data: author } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", proposal.author_id)
    .single();

  // Get votes
  const { data: votes } = await supabase
    .from("votes")
    .select("id, member_id, signal")
    .eq("proposal_id", id);

  const approvals = votes?.filter((v) => v.signal === "approve").length ?? 0;
  const rejections = votes?.filter((v) => v.signal === "reject").length ?? 0;
  const userVote = votes?.find((v) => v.member_id === user.id);

  // Get total eligible voters
  const { count: totalMembers } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", community.id)
    .eq("status", "active");

  // Get comments with author info
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, author_id, created_at")
    .eq("proposal_id", id)
    .order("created_at", { ascending: true });

  const commentAuthorIds = [
    ...new Set(comments?.map((c) => c.author_id) ?? []),
  ];
  const { data: commentAuthors } = commentAuthorIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", commentAuthorIds)
    : { data: [] };

  const authorMap = new Map(
    commentAuthors?.map((a) => [a.id, a.display_name]) ?? [],
  );

  const statusInfo = STATUS_LABELS[proposal.status] ?? {
    label: proposal.status,
    color: "bg-zinc-50 text-zinc-700",
  };

  const isAuthor = proposal.author_id === user.id;
  const isVoting = proposal.status === "voting";
  const isDiscussion = proposal.status === "discussion";

  const moveToVotingBound = moveToVoting.bind(null, id, slug);
  const castApproveBound = castVote.bind(null, id, slug, "approve");
  const castRejectBound = castVote.bind(null, id, slug, "reject");
  const addCommentBound = addComment.bind(null, id, slug);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href={`/communities/${slug}/proposals`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to proposals
          </Link>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">
              {proposal.title}
            </h1>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {TYPE_LABELS[proposal.proposal_type] ?? proposal.proposal_type}
            {" \u00b7 proposed by "}
            {author?.display_name ?? "Unknown"}
            {" \u00b7 "}
            {new Date(proposal.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Description */}
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {proposal.description}
          </p>
        </div>

        {/* Voting section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Vote</h2>

          {/* Vote tally */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center justify-between text-sm">
              <span>
                {approvals + rejections} of {totalMembers ?? 0} members voted
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                Threshold: {proposal.approval_threshold}% to pass
              </span>
            </div>

            {(approvals + rejections) > 0 && (
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {approvals > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(approvals / (approvals + rejections)) * 100}%`,
                    }}
                  />
                )}
                {rejections > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(rejections / (approvals + rejections)) * 100}%`,
                    }}
                  />
                )}
              </div>
            )}

            <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>{approvals} approve</span>
              <span>{rejections} reject</span>
            </div>
          </div>

          {/* Vote actions */}
          {isDiscussion && isAuthor && (
            <form action={moveToVotingBound}>
              <SubmitButton
                pendingText="Opening vote..."
                className="inline-flex h-9 items-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                Move to voting
              </SubmitButton>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                This will open a 7-day voting period for all community members.
              </p>
            </form>
          )}

          {isVoting && (
            <div className="space-y-3">
              {userVote && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  You voted:{" "}
                  <span className="font-medium">
                    {userVote.signal === "approve" ? "Approve" : "Reject"}
                  </span>
                  . You can change your vote.
                </p>
              )}
              <div className="flex gap-3">
                <form action={castApproveBound}>
                  <SubmitButton
                    className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
                      userVote?.signal === "approve"
                        ? "bg-green-600 text-white"
                        : "border border-green-600 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                    }`}
                  >
                    Approve
                  </SubmitButton>
                </form>
                <form action={castRejectBound}>
                  <SubmitButton
                    className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50 ${
                      userVote?.signal === "reject"
                        ? "bg-red-600 text-white"
                        : "border border-red-600 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    }`}
                  >
                    Reject
                  </SubmitButton>
                </form>
              </div>

              {proposal.voting_deadline && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Voting closes{" "}
                  {new Date(proposal.voting_deadline).toLocaleDateString(
                    undefined,
                    { weekday: "long", month: "long", day: "numeric" },
                  )}
                </p>
              )}
            </div>
          )}

          {(proposal.status === "approved" ||
            proposal.status === "rejected") && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This proposal has been{" "}
              <span className="font-medium">{proposal.status}</span>.
              {proposal.status === "approved" &&
                " It will be built and deployed."}
            </p>
          )}
        </section>

        {/* Deliberation */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Deliberation ({comments?.length ?? 0})
          </h2>

          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {authorMap.get(comment.author_id) ?? "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No comments yet. Start the deliberation.
            </p>
          )}

          {/* Comment form */}
          <form action={addCommentBound} className="space-y-3">
            <textarea
              name="body"
              required
              rows={3}
              placeholder="Share your thoughts on this proposal..."
              className="flex w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-100"
            />
            <SubmitButton
              pendingText="Adding..."
              className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Add comment
            </SubmitButton>
          </form>
        </section>
      </div>
    </div>
  );
}
