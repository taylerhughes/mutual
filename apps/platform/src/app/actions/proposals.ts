"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProposalType } from "@/types/database";

export async function createProposal(communitySlug: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const communityId = formData.get("community_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const proposalType = (formData.get("proposal_type") as ProposalType) || "flag_test";

  // Check member count — solo creators get auto-approval.
  // For draft communities the founder has no stake, so count founding
  // membership separately.
  const { data: community } = await supabase
    .from("communities")
    .select("id, status, founding_member_id")
    .eq("id", communityId)
    .single();

  const { count: stakeCount } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("status", "active");

  const isDraft = community?.status === "draft";
  const isFounder = community?.founding_member_id === user.id;
  const memberCount = (stakeCount ?? 0) + (isDraft && isFounder ? 1 : 0);
  const autoApprove = memberCount <= 1;

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      community_id: communityId,
      author_id: user.id,
      title,
      description,
      proposal_type: proposalType,
      status: autoApprove ? "approved" : "discussion",
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/communities/${communitySlug}/proposals/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/communities/${communitySlug}`);
  redirect(`/communities/${communitySlug}/proposals/${proposal.id}`);
}

export async function moveToVoting(proposalId: string, communitySlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);

  await supabase
    .from("proposals")
    .update({
      status: "voting",
      voting_deadline: deadline.toISOString(),
    })
    .eq("id", proposalId)
    .eq("author_id", user.id);

  revalidatePath(`/communities/${communitySlug}/proposals/${proposalId}`);
}

export async function castVote(
  proposalId: string,
  communitySlug: string,
  signal: "approve" | "reject",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Delete existing vote if any (allows changing vote)
  await supabase
    .from("votes")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("member_id", user.id);

  await supabase.from("votes").insert({
    proposal_id: proposalId,
    member_id: user.id,
    signal,
  });

  await checkAndResolveVote(proposalId, communitySlug);

  revalidatePath(`/communities/${communitySlug}/proposals/${proposalId}`);
}

async function checkAndResolveVote(proposalId: string, communitySlug: string) {
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, community_id, status")
    .eq("id", proposalId)
    .single();

  if (!proposal || proposal.status !== "voting") return;

  const { count: totalMembers } = await supabase
    .from("stakes")
    .select("id", { count: "exact", head: true })
    .eq("community_id", proposal.community_id)
    .eq("status", "active");

  const { data: votes } = await supabase
    .from("votes")
    .select("signal")
    .eq("proposal_id", proposalId);

  if (!votes || !totalMembers) return;

  const approvals = votes.filter((v) => v.signal === "approve").length;
  const rejections = votes.filter((v) => v.signal === "reject").length;

  // Simple majority: more than half of all members
  const majority = Math.floor(totalMembers / 2) + 1;

  if (approvals >= majority) {
    await supabase
      .from("proposals")
      .update({ status: "approved" })
      .eq("id", proposalId);
  } else if (rejections >= majority) {
    await supabase
      .from("proposals")
      .update({ status: "rejected" })
      .eq("id", proposalId);
  }

  revalidatePath(`/communities/${communitySlug}/proposals/${proposalId}`);
}

export async function addComment(
  proposalId: string,
  communitySlug: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const body = formData.get("body") as string;

  await supabase.from("comments").insert({
    proposal_id: proposalId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/communities/${communitySlug}/proposals/${proposalId}`);
}
