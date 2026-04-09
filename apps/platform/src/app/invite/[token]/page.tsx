import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: invite } = await supabase
    .from("invites")
    .select("id, community_id, status")
    .eq("token", token)
    .single();

  if (!invite) notFound();

  const { data: community } = await supabase
    .from("communities")
    .select("name, slug, description, entry_stake_amount, currency")
    .eq("id", invite.community_id)
    .single();

  if (!community) notFound();

  const formattedPrice = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: community.currency,
  }).format(community.entry_stake_amount / 100);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;ve been invited to join
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {community.name}
          </h1>
          {community.description && (
            <p className="text-zinc-600 dark:text-zinc-400">
              {community.description}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Entry stake: {formattedPrice}
          </p>
        </div>

        <Link
          href={`/communities/${community.slug}`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          View community
        </Link>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          You&apos;ll need to sign in and acquire a stake to join.
        </p>
      </div>
    </div>
  );
}
