-- Supabase schema for API portal (v1)
-- Run in Supabase SQL editor using a privileged role.

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id text primary key default ('acct_' || replace(gen_random_uuid()::text, '-', '')),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_accounts_owner_unique
  on public.accounts (owner_user_id);

create table if not exists public.account_profile (
  account_id text primary key references public.accounts(id) on delete cascade,
  display_name text not null default '',
  billing_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id text primary key default ('key_' || replace(gen_random_uuid()::text, '-', '')),
  account_id text not null references public.accounts(id) on delete cascade,
  key_prefix text not null,
  key_hash_sha256 text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  rate_limit_per_minute integer not null default 120,
  monthly_hard_limit_chars bigint,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists idx_api_keys_hash_unique
  on public.api_keys (key_hash_sha256);

create index if not exists idx_api_keys_account_status
  on public.api_keys (account_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_accounts_updated_at on public.accounts;
create trigger trg_accounts_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_account_profile_updated_at on public.account_profile;
create trigger trg_account_profile_updated_at
before update on public.account_profile
for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;
alter table public.account_profile enable row level security;
alter table public.api_keys enable row level security;

-- Owner can manage own account.
drop policy if exists accounts_owner_all on public.accounts;
create policy accounts_owner_all
on public.accounts
for all
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

-- Owner can manage profile through account ownership.
drop policy if exists account_profile_owner_all on public.account_profile;
create policy account_profile_owner_all
on public.account_profile
for all
using (
  exists (
    select 1 from public.accounts a
    where a.id = account_profile.account_id
      and a.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.accounts a
    where a.id = account_profile.account_id
      and a.owner_user_id = auth.uid()
  )
);

-- Owner can manage keys through account ownership.
drop policy if exists api_keys_owner_all on public.api_keys;
create policy api_keys_owner_all
on public.api_keys
for all
using (
  exists (
    select 1 from public.accounts a
    where a.id = api_keys.account_id
      and a.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.accounts a
    where a.id = api_keys.account_id
      and a.owner_user_id = auth.uid()
  )
);
