"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/slug";

export async function createSoftwareProposal(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const whatItDoes = formData.get("what_it_does") as string;
  const whoItServes = formData.get("who_it_serves") as string;
  const whyNeeded = formData.get("why_needed") as string;
  const votingModel = (formData.get("voting_model") as string) || "flat";
  const stakeAmountPounds = parseFloat(formData.get("entry_stake_amount") as string) || 15;
  const cosignerThreshold = parseInt(formData.get("cosigner_threshold") as string) || 5;

  // Build structured description
  const description = [
    `**What it does**\n${whatItDoes}`,
    `**Who it serves**\n${whoItServes}`,
    `**Why existing solutions don't work**\n${whyNeeded}`,
  ].join("\n\n");

  // Generate slug, handle collisions
  let slug = generateSlug(name);
  const { data: existing } = await supabase
    .from("communities")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  // Create the proposed community
  const { data: community, error } = await supabase
    .from("communities")
    .insert({
      name,
      slug,
      description,
      founding_member_id: user.id,
      voting_model: votingModel,
      entry_stake_amount: Math.round(stakeAmountPounds * 100), // convert to pence
      currency: "gbp",
      cosigner_threshold: Math.max(2, cosignerThreshold),
      status: "proposed",
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/propose/new?error=${encodeURIComponent(error.message)}`);
  }

  // Auto co-sign for the proposer
  await supabase.from("co_signatures").insert({
    community_id: community.id,
    user_id: user.id,
  });

  revalidatePath("/propose");
  redirect(`/propose/${community.slug}`);
}

export async function coSign(communityId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("co_signatures").insert({
    community_id: communityId,
    user_id: user.id,
  });

  await checkAndActivate(communityId);

  revalidatePath(`/propose/${slug}`);
  revalidatePath("/propose");
}

export async function withdrawCoSignature(communityId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Proposer cannot withdraw
  const { data: community } = await supabase
    .from("communities")
    .select("founding_member_id")
    .eq("id", communityId)
    .single();

  if (community?.founding_member_id === user.id) {
    return; // Proposer can't withdraw their endorsement
  }

  await supabase
    .from("co_signatures")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  revalidatePath(`/propose/${slug}`);
  revalidatePath("/propose");
}

async function checkAndActivate(communityId: string) {
  // Use admin client so we can update community status and create the founding stake
  const supabase = createAdminClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, cosigner_threshold, founding_member_id, entry_stake_amount, status")
    .eq("id", communityId)
    .single();

  if (!community || community.status !== "proposed") return;

  const { count } = await supabase
    .from("co_signatures")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId);

  if (!count || count < community.cosigner_threshold) return;

  // Threshold reached — activate the community
  // Use WHERE status='proposed' for idempotency
  const { data: updated } = await supabase
    .from("communities")
    .update({ status: "active" })
    .eq("id", communityId)
    .eq("status", "proposed")
    .select("id")
    .single();

  if (!updated) return; // Already activated by a concurrent request

  // Create a free stake for the founding member
  await supabase.from("stakes").insert({
    member_id: community.founding_member_id,
    community_id: communityId,
    amount: community.entry_stake_amount,
    status: "active",
  });

  revalidatePath("/dashboard");
  revalidatePath("/propose");
}
