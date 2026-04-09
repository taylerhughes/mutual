-- Add 'draft' status for communities that are being built but not yet published
-- Drop and recreate the status check constraint to include 'draft'
alter table public.communities drop constraint if exists communities_status_check;
alter table public.communities add constraint communities_status_check
  check (status in ('draft', 'active', 'wound_down'));

-- Allow founding members to view and manage proposals in their draft communities
-- (they won't have a stake yet, so existing RLS policies would block them)
create policy "Founding members can view proposals in their communities"
  on public.proposals for select
  using (
    community_id in (
      select id from public.communities
      where founding_member_id = (select auth.uid())
    )
  );

create policy "Founding members can create proposals in their communities"
  on public.proposals for insert
  with check (
    (select auth.uid()) = author_id
    and community_id in (
      select id from public.communities
      where founding_member_id = (select auth.uid())
    )
  );

-- Allow founding members to view and create comments in their draft communities
create policy "Founding members can view comments in their communities"
  on public.comments for select
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.communities c on c.id = p.community_id
      where c.founding_member_id = (select auth.uid())
    )
  );

create policy "Founding members can comment in their communities"
  on public.comments for insert
  with check (
    (select auth.uid()) = author_id
    and proposal_id in (
      select p.id from public.proposals p
      join public.communities c on c.id = p.community_id
      where c.founding_member_id = (select auth.uid())
    )
  );

-- Allow founding members to view votes in their communities
create policy "Founding members can view votes in their communities"
  on public.votes for select
  using (
    proposal_id in (
      select p.id from public.proposals p
      join public.communities c on c.id = p.community_id
      where c.founding_member_id = (select auth.uid())
    )
  );
