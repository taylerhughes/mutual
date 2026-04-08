"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function purchaseStake(communityId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has an active stake in this community
  const { data: existingStake } = await supabase
    .from("stakes")
    .select("id, status")
    .eq("member_id", user.id)
    .eq("community_id", communityId)
    .in("status", ["active", "pending"])
    .maybeSingle();

  if (existingStake) {
    if (existingStake.status === "active") {
      redirect(`/dashboard?error=${encodeURIComponent("You already have a stake in this community")}`);
    }
    // If pending, let them retry — clean up the old pending stake
    await supabase
      .from("stakes")
      .delete()
      .eq("id", existingStake.id);
  }

  // Fetch community details for the checkout session
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name, slug, entry_stake_amount, currency")
    .eq("id", communityId)
    .single();

  if (communityError || !community) {
    redirect("/dashboard?error=Community+not+found");
  }

  // Create a pending stake
  const { data: stake, error: stakeError } = await supabase
    .from("stakes")
    .insert({
      member_id: user.id,
      community_id: community.id,
      amount: community.entry_stake_amount,
      status: "pending",
    })
    .select("id")
    .single();

  if (stakeError || !stake) {
    redirect(`/communities/${community.slug}?error=${encodeURIComponent("Failed to create stake")}`);
  }

  // Create Stripe Checkout Session
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: community.currency,
          product_data: {
            name: `Stake in ${community.name}`,
            description: `Governance stake in the ${community.name} community on Mutual`,
          },
          unit_amount: community.entry_stake_amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      stake_id: stake.id,
      community_id: community.id,
      member_id: user.id,
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/communities/${community.slug}?cancelled=true`,
  });

  // Store checkout session ID on the stake
  await supabase
    .from("stakes")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", stake.id);

  if (!session.url) {
    redirect(`/communities/${community.slug}?error=Failed+to+create+checkout+session`);
  }

  redirect(session.url);
}
