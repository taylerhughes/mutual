"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropicClient } from "@/lib/anthropic";
import type { TicketStatus } from "@/types/database";

export async function generateTickets(communityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user is the founder
  const { data: community } = await supabase
    .from("communities")
    .select("id, name, description, slug, founding_member_id")
    .eq("id", communityId)
    .single();

  if (!community || community.founding_member_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Idempotency: skip if tickets already exist
  const { count } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId);

  if (count && count > 0) {
    return { error: "Tickets already generated" };
  }

  // Call Claude to generate MVP tickets
  const anthropic = createAnthropicClient();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a product manager breaking down an MVP into actionable build tickets.

Given the following software idea, generate 5-8 tickets that represent the core work needed to build a minimum viable product. Each ticket should be a concrete, actionable task — not vague or aspirational.

Focus on the essential features only. No nice-to-haves, no infrastructure beyond what's needed, no testing-specific tickets. Think about what a single developer would build in the first sprint to get something usable in front of users.

Software name: ${community.name}
Software description: ${community.description ?? "No description provided."}

Respond with ONLY a JSON array of objects, each with "title" (short, imperative — e.g. "Build user registration flow") and "description" (2-3 sentences explaining the scope and acceptance criteria). No markdown, no explanation, just the JSON array.`,
      },
    ],
  });

  // Extract text from response
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { error: "Failed to generate tickets" };
  }

  let tickets: { title: string; description: string }[];
  try {
    tickets = JSON.parse(textBlock.text);
  } catch {
    return { error: "Failed to parse ticket response" };
  }

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return { error: "No tickets generated" };
  }

  // Insert tickets via admin client (system operation during generation)
  const admin = createAdminClient();

  const rows = tickets.map((ticket, index) => ({
    community_id: communityId,
    title: ticket.title,
    description: ticket.description,
    status: "todo",
    position: index,
  }));

  const { error } = await admin.from("tickets").insert(rows);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/communities/${community.slug}/build`);
  return { success: true };
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  communitySlug: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify the ticket belongs to a community the user founded
  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, community_id")
    .eq("id", ticketId)
    .single();

  if (!ticket) {
    return { error: "Ticket not found" };
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id, founding_member_id")
    .eq("id", ticket.community_id)
    .single();

  if (!community || community.founding_member_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("tickets")
    .update({ status: newStatus })
    .eq("id", ticketId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/communities/${communitySlug}/build`);
  return { success: true };
}
