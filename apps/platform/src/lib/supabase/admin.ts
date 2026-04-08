import { createClient } from "@supabase/supabase-js";

// Admin client bypasses RLS — use only in server-side contexts
// like webhook handlers where there is no user session.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
