"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInvite(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const token = crypto.randomUUID();

  await supabase.from("invites").insert({
    community_id: communityId,
    inviter_id: user.id,
    token,
  });

  revalidatePath(`/communities/${communitySlug}`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { url: `${appUrl}/invite/${token}` };
}
