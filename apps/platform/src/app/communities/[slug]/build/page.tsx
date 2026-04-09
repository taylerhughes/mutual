import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard, TicketGenerator } from "@/components/kanban-board";
import type { Ticket } from "@/types/database";

export default async function BuildPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  // Only the founder can access the build page for draft communities
  if (isDraft && !isFounder) {
    notFound();
  }

  // Check membership for active communities
  if (!isDraft && !isFounder) {
    let existingStake = null;
    if (user) {
      const { data } = await supabase
        .from("stakes")
        .select("id")
        .eq("member_id", user.id)
        .eq("community_id", community.id)
        .eq("status", "active")
        .maybeSingle();
      existingStake = data;
    }
    if (!existingStake) {
      notFound();
    }
  }

  // Fetch existing tickets
  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .eq("community_id", community.id)
    .order("position", { ascending: true });

  const hasTickets = tickets && tickets.length > 0;

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <Link
            href={`/communities/${slug}`}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; {community.name}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Build</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            MVP build plan for {community.name}
          </p>
        </div>

        {hasTickets ? (
          <KanbanBoard
            tickets={tickets as Ticket[]}
            communitySlug={slug}
          />
        ) : isFounder ? (
          <TicketGenerator communityId={community.id} />
        ) : (
          <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No build plan yet. The founder will set this up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
