import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { coSign, withdrawCoSignature } from "@/app/actions/propose";

export default async function ProposeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const isActivated = community.status === "active";
  const isProposer = user?.id === community.founding_member_id;

  // Get proposer profile
  const { data: founder } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", community.founding_member_id)
    .single();

  // Get co-signatures with user profiles
  const { data: coSignatures } = await supabase
    .from("co_signatures")
    .select("id, user_id, created_at")
    .eq("community_id", community.id)
    .order("created_at", { ascending: true });

  const cosignerIds = coSignatures?.map((c) => c.user_id) ?? [];
  const { data: cosignerProfiles } = cosignerIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", cosignerIds)
    : { data: [] };

  const profileMap = new Map(
    cosignerProfiles?.map((p) => [p.id, p.display_name]) ?? [],
  );

  const cosignCount = coSignatures?.length ?? 0;
  const progress = Math.min(
    100,
    Math.round((cosignCount / community.cosigner_threshold) * 100),
  );
  const hasCoSigned = coSignatures?.some((c) => c.user_id === user?.id) ?? false;

  const coSignBound = coSign.bind(null, community.id, slug);
  const withdrawBound = withdrawCoSignature.bind(null, community.id, slug);

  // Parse description sections
  const descriptionSections: string[] = community.description?.split("\n\n") ?? [];

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/propose"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Back to proposals
          </Link>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">
              {community.name}
            </h1>
            {isActivated ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                Community created
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Gathering support
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Proposed by {founder?.display_name ?? "Unknown"}
            {" \u00b7 "}
            {new Date(community.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          {descriptionSections.map((section, i) => (
            <div key={i} className="text-sm leading-relaxed">
              {section.startsWith("**") ? (
                <>
                  <p className="font-semibold">
                    {section.split("\n")[0].replace(/\*\*/g, "")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                    {section.split("\n").slice(1).join("\n")}
                  </p>
                </>
              ) : (
                <p className="whitespace-pre-wrap">{section}</p>
              )}
            </div>
          ))}
        </div>

        {/* Governance config */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Voting model
            </p>
            <p className="text-lg font-semibold capitalize">
              {community.voting_model.replace("_", " ")}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Entry stake
            </p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat("en-GB", {
                style: "currency",
                currency: community.currency,
              }).format(community.entry_stake_amount / 100)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Threshold
            </p>
            <p className="text-lg font-semibold">
              {community.cosigner_threshold} co-signers
            </p>
          </div>
        </div>

        {/* Co-signer progress */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Co-signers ({cosignCount}/{community.cosigner_threshold})
          </h2>

          <div className="space-y-3">
            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  isActivated ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {isActivated ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Threshold reached! This community is now active.
                </p>
                <Link
                  href={`/communities/${slug}`}
                  className="mt-2 inline-flex h-9 items-center rounded-md bg-green-700 px-4 text-sm font-medium text-white transition-colors hover:bg-green-800"
                >
                  Go to community &rarr;
                </Link>
              </div>
            ) : (
              <>
                {/* Co-sign action */}
                {!hasCoSigned ? (
                  <form action={coSignBound}>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Co-sign this proposal
                    </button>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Signal that you believe this software should exist.
                      Co-signing is not a commitment to join.
                    </p>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      You co-signed this proposal
                    </span>
                    {!isProposer && (
                      <form action={withdrawBound}>
                        <button
                          type="submit"
                          className="text-sm text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                          Withdraw
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Co-signer list */}
            <div className="space-y-2">
              {coSignatures?.map((cs) => (
                <div
                  key={cs.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {profileMap.get(cs.user_id) ?? "Unknown"}
                    {cs.user_id === community.founding_member_id && (
                      <span className="ml-1.5 text-xs text-zinc-400">
                        (proposer)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(cs.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
