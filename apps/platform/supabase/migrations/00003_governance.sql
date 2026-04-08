-- ============================================================
-- PROPOSALS
-- Feature proposals submitted by community members
-- ============================================================
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null,
  description text not null,
  proposal_type text not null default 'flag_test'
    check (proposal_type in ('flag_test', 'branch_test', 'governance_vote')),
  status text not null default 'discussion'
    check (status in (
      'discussion',     -- idea submitted, open for deliberation
      'voting',         -- formally raised, vote in progress
      'approved',       -- vote passed threshold
      'rejected',       -- vote failed threshold
      'building',       -- approved and being built
      'deployed',       -- built and deployed (flag active or branch live)
      'merged',         -- flag made permanent / branch merged
      'rolled_back'     -- removed after rejection
    )),
  voting_deadline timestamptz,          -- when the vote closes
  approval_threshold integer not null default 50, -- percentage needed to pass
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger proposals_updated_at
  before update on public.proposals
  for each row execute function public.update_updated_at();

alter table public.proposals enable row level security;

-- Anyone can view proposals in communities they belong to
create policy "Community members can view proposals"
  on public.proposals for select
  using (
    community_id in (
      select s.community_id from public.stakes s
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Members can create proposals in their communities
create policy "Community members can create proposals"
  on public.proposals for insert
  with check (
    (select auth.uid()) = author_id
    and community_id in (
      select s.community_id from public.stakes s
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Authors can update their own proposals (e.g. edit during discussion)
create policy "Authors can update their proposals"
  on public.proposals for update
  using ((select auth.uid()) = author_id);

-- ============================================================
-- VOTES
-- Member votes on proposals
-- ============================================================
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_id uuid not null references public.profiles(id),
  signal text not null check (signal in ('approve', 'reject')),
  created_at timestamptz not null default now(),
  unique (proposal_id, member_id) -- one vote per member per proposal
);

alter table public.votes enable row level security;

-- Members can view votes on proposals in their communities
create policy "Community members can view votes"
  on public.votes for select
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.stakes s on s.community_id = p.community_id
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Members can cast votes on proposals in their communities
create policy "Community members can vote"
  on public.votes for insert
  with check (
    (select auth.uid()) = member_id
    and proposal_id in (
      select p.id from public.proposals p
      join public.stakes s on s.community_id = p.community_id
      where s.member_id = (select auth.uid()) and s.status = 'active'
      and p.status = 'voting'
    )
  );

-- Members can change their vote (delete and re-insert)
create policy "Members can delete their own votes"
  on public.votes for delete
  using ((select auth.uid()) = member_id);

-- ============================================================
-- COMMENTS
-- Deliberation threads on proposals
-- ============================================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at();

alter table public.comments enable row level security;

-- Members can view comments on proposals in their communities
create policy "Community members can view comments"
  on public.comments for select
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.stakes s on s.community_id = p.community_id
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Members can create comments on proposals in their communities
create policy "Community members can comment"
  on public.comments for insert
  with check (
    (select auth.uid()) = author_id
    and proposal_id in (
      select p.id from public.proposals p
      join public.stakes s on s.community_id = p.community_id
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Authors can update their own comments
create policy "Authors can update their comments"
  on public.comments for update
  using ((select auth.uid()) = author_id);
