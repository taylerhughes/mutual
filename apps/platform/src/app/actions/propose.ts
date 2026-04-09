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

  // Use admin client to create community + founding stake in one operation
  const admin = createAdminClient();

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
      status: "active",
    })
    .select("id, slug")
    .single();

  if (error) {
    redirect(`/propose/new?error=${encodeURIComponent(error.message)}`);
  }

  // Create free trial founding stake
  // Founder gets immediate access; trial_expires_at is set but the
  // specific duration is a product decision (7 days, 30 days, etc.)
  // For now, default to 30 days.
  const trialExpiry = new Date();
  trialExpiry.setDate(trialExpiry.getDate() + 30);

  await admin.from("stakes").insert({
    member_id: user.id,
    community_id: community.id,
    amount: 0,
    status: "active",
    is_founding: true,
    trial_expires_at: trialExpiry.toISOString(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/propose");
  redirect(`/communities/${community.slug}`);
}
