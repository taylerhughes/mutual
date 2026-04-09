"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/slug";

export async function createSoftware(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

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

  const admin = createAdminClient();

  // Create community in draft status — no stake yet.
  // The founder has access via founding_member_id.
  // They'll create a stake when they publish.
  const { data: community, error } = await admin
    .from("communities")
    .insert({
      name,
      slug,
      description,
      founding_member_id: user.id,
      voting_model: "flat",
      entry_stake_amount: 1500, // £15.00
      currency: "gbp",
      status: "draft",
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/propose/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/communities/${community.slug}`);
}

export async function publishSoftware(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify user is the founding member
  const { data: community } = await supabase
    .from("communities")
    .select("id, founding_member_id, entry_stake_amount, status")
    .eq("id", communityId)
    .single();

  if (!community || community.founding_member_id !== user.id) {
    redirect(`/communities/${communitySlug}?error=Not+authorized`);
  }

  if (community.status !== "draft") {
    redirect(`/communities/${communitySlug}`);
  }

  const admin = createAdminClient();

  // Create the founding stake (paid via Stripe or free for now)
  // For Phase 1: founding member gets their stake when they publish
  await admin.from("stakes").insert({
    member_id: user.id,
    community_id: communityId,
    amount: community.entry_stake_amount,
    status: "active",
    is_founding: true,
  });

  // Flip community to active — now visible in directory
  await admin
    .from("communities")
    .update({ status: "active" })
    .eq("id", communityId)
    .eq("status", "draft");

  revalidatePath("/dashboard");
  revalidatePath("/propose");
  revalidatePath(`/communities/${communitySlug}`);
}
