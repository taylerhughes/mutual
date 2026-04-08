-- Allow authenticated users to insert their own stakes (pending status only)
create policy "Members can create their own pending stakes"
  on public.stakes for insert
  with check (
    (select auth.uid()) = member_id
    and status = 'pending'
  );

-- Allow members to update their own stakes (for relinquishing)
create policy "Members can update their own stakes"
  on public.stakes for update
  using ((select auth.uid()) = member_id);

-- Allow members to delete their own pending stakes (for cleanup on retry)
create policy "Members can delete their own pending stakes"
  on public.stakes for delete
  using (
    (select auth.uid()) = member_id
    and status = 'pending'
  );

-- Add stripe_checkout_session_id to stakes for tracking checkout sessions
alter table public.stakes
  add column if not exists stripe_checkout_session_id text;
