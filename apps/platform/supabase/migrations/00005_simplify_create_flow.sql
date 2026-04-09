-- ============================================================
-- Simplify create flow: remove co-signing, add invites
-- ============================================================

-- Drop co-signing infrastructure (no longer needed)
drop table if exists public.co_signatures cascade;
alter table public.communities drop column if exists cosigner_threshold;

-- Update communities INSERT policy: allow creating active communities directly
drop policy if exists "Authenticated users can create proposed communities" on public.communities;

create policy "Authenticated users can create communities"
  on public.communities for insert
  with check (
    (select auth.uid()) = founding_member_id
  );

-- ============================================================
-- INVITES
-- Shareable invite links for communities
-- ============================================================
create table public.invites (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id),
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.invites enable row level security;

-- Anyone can look up an invite by token (needed for the accept page)
create policy "Invites are publicly readable"
  on public.invites for select
  using (true);

-- Community members can create invites
create policy "Community members can create invites"
  on public.invites for insert
  with check (
    (select auth.uid()) = inviter_id
    and community_id in (
      select s.community_id from public.stakes s
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Inviter can update their own invites
create policy "Inviters can update their invites"
  on public.invites for update
  using ((select auth.uid()) = inviter_id);
