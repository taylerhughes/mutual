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

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      community_id: communityId,
      author_id: user.id,
      title,
      description,
      proposal_type: proposalType,
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

  // Set voting deadline to 7 days from now
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

  // Check if threshold is reached
  await checkAndResolveVote(proposalId, communitySlug);

  revalidatePath(`/communities/${communitySlug}/proposals/${proposalId}`);
}

async function checkAndResolveVote(proposalId: string, communitySlug: string) {
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, community_id, approval_threshold, status")
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
  const totalVotes = votes.length;

  // Need at least a majority of members to have voted (quorum)
  const quorum = Math.ceil(totalMembers / 2);
  if (totalVotes < quorum) return;

  const approvalPercent = Math.round((approvals / totalVotes) * 100);

  if (approvalPercent >= proposal.approval_threshold) {
    await supabase
      .from("proposals")
      .update({ status: "approved" })
      .eq("id", proposalId);
  } else if (rejections >= Math.ceil(totalMembers / 2)) {
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
