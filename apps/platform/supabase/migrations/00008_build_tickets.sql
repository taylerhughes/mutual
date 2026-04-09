-- ============================================================
-- TICKETS
-- Build tasks for community software MVPs
-- ============================================================
create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references public.communities(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'done')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tickets_updated_at
  before update on public.tickets
  for each row execute function public.update_updated_at();

alter table public.tickets enable row level security;

-- Founding members can view tickets in their communities
create policy "Founding members can view tickets"
  on public.tickets for select
  using (
    community_id in (
      select id from public.communities
      where founding_member_id = (select auth.uid())
    )
  );

-- Community members with active stakes can view tickets
create policy "Community members can view tickets"
  on public.tickets for select
  using (
    community_id in (
      select s.community_id from public.stakes s
      where s.member_id = (select auth.uid()) and s.status = 'active'
    )
  );

-- Founding members can update tickets (move between columns)
create policy "Founding members can update tickets"
  on public.tickets for update
  using (
    community_id in (
      select id from public.communities
      where founding_member_id = (select auth.uid())
    )
  );

-- Founding members can insert tickets (for AI generation)
create policy "Founding members can insert tickets"
  on public.tickets for insert
  with check (
    community_id in (
      select id from public.communities
      where founding_member_id = (select auth.uid())
    )
  );
