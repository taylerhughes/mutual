-- Seed a test community for local development.
-- The founding_member_id must reference an existing profile.
-- Run this AFTER creating a user account through the app.
--
-- Usage:
--   1. Start the app and create an account via /signup
--   2. Find your user ID: select id from auth.users limit 1;
--   3. Update the founding_member_id below, then run:
--      psql $DATABASE_URL -f supabase/seed.sql
--
-- Or use this migration-style insert that picks the first available user:

insert into public.communities (name, slug, description, founding_member_id, voting_model, entry_stake_amount, currency, status)
select
  'Civic Tools Collective',
  'civic-tools',
  'A community building open civic technology for local councils and neighbourhood groups. Tools for planning consultations, community notice boards, and shared resource tracking.',
  id,
  'flat',
  1500, -- £15.00
  'gbp',
  'active'
from public.profiles
limit 1
on conflict (slug) do nothing;
