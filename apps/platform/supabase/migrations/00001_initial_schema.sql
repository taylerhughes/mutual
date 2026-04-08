-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with platform-specific data
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- ============================================================
-- COMMUNITIES
-- Each community is a software project governed by its members
-- ============================================================
create table public.communities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  founding_member_id uuid not null references public.profiles(id),
  voting_model text not null default 'flat'
    check (voting_model in ('flat', 'contribution_weighted', 'quadratic')),
  entry_stake_amount integer not null, -- in smallest currency unit (pence/cents)
  currency text not null default 'gbp',
  status text not null default 'active'
    check (status in ('proposed', 'active', 'wound_down')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communities enable row level security;

create policy "Communities are publicly visible"
  on public.communities for select
  using (true);

create policy "Founding member can update community"
  on public.communities for update
  using ((select auth.uid()) = founding_member_id);

-- ============================================================
-- STAKES
-- A member's ownership stake in a community
-- ============================================================
create table public.stakes (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid not null references public.profiles(id),
  community_id uuid not null references public.communities(id),
  amount integer not null,               -- amount paid in smallest currency unit
  stripe_payment_intent_id text,
  status text not null default 'active'
    check (status in ('pending', 'active', 'relinquished')),
  joined_at timestamptz not null default now(),
  relinquished_at timestamptz,
  unique (member_id, community_id)       -- one stake per member per community
);

alter table public.stakes enable row level security;

create policy "Members can view their own stakes"
  on public.stakes for select
  using ((select auth.uid()) = member_id);

create policy "Community members can view co-members"
  on public.stakes for select
  using (
    community_id in (
      select s.community_id from public.stakes s
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger communities_updated_at
  before update on public.communities
  for each row execute function public.update_updated_at();
