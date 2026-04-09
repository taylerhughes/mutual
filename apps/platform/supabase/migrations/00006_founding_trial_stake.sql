-- Add founding member trial support to stakes
alter table public.stakes
  add column if not exists is_founding boolean not null default false;

alter table public.stakes
  add column if not exists trial_expires_at timestamptz;
