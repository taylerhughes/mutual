import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const stakeId = session.metadata?.stake_id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!stakeId) {
      console.error("Webhook: missing stake_id in session metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Activate the stake
    const { error } = await supabase
      .from("stakes")
      .update({
        status: "active",
        stripe_payment_intent_id: paymentIntentId ?? null,
        joined_at: new Date().toISOString(),
      })
      .eq("id", stakeId)
      .eq("status", "pending");

    if (error) {
      console.error("Webhook: failed to activate stake:", error);
      return NextResponse.json(
        { error: "Failed to activate stake" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
