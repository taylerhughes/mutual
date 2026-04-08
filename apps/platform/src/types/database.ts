// This file will be replaced by auto-generated types from Supabase CLI:
//   npx supabase gen types typescript --local > src/types/database.ts
//
// For now, define the core types manually to unblock development.

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  founding_member_id: string;
  voting_model: "flat" | "contribution_weighted" | "quadratic";
  entry_stake_amount: number;
  currency: string;
  status: "proposed" | "active" | "wound_down";
  created_at: string;
  updated_at: string;
};

export type Stake = {
  id: string;
  member_id: string;
  community_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  status: "pending" | "active" | "relinquished";
  joined_at: string;
  relinquished_at: string | null;
};
