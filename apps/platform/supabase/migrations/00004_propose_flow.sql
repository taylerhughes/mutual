-- ============================================================
-- CO_SIGNATURES
-- Tracks endorsements for proposed software projects
-- ============================================================
create table public.co_signatures (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (community_id, user_id) -- one co-signature per user per proposal
);

alter table public.co_signatures enable row level security;

create policy "Co-signatures are publicly visible"
  on public.co_signatures for select
  using (true);

create policy "Authenticated users can co-sign proposed communities"
  on public.co_signatures for insert
  with check (
    (select auth.uid()) = user_id
    and community_id in (
      select id from public.communities where status = 'proposed'
    )
  );

create policy "Users can remove their own co-signature"
  on public.co_signatures for delete
  using ((select auth.uid()) = user_id);

-- ============================================================
-- Add cosigner_threshold to communities
-- ============================================================
alter table public.communities
  add column if not exists cosigner_threshold integer not null default 5;

-- ============================================================
-- Allow authenticated users to create proposed communities
-- ============================================================
create policy "Authenticated users can create proposed communities"
  on public.communities for insert
  with check (
    (select auth.uid()) = founding_member_id
    and status = 'proposed'
  );
