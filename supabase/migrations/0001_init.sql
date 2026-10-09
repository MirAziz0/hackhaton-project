-- Growenta: initial schema, RLS policies, storage buckets and realtime.
-- Run once in the Supabase SQL editor (or via `supabase db push`). Safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  track text check (track in ('cosmetics', 'food', 'clothing', 'it_services', 'education', 'other')),
  stage text check (stage in ('idea', 'plan_ready', 'operating')),
  city text,
  budget_range text,
  products text,
  target_customer text,
  bio text,
  looking_for text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  idea_text text,
  plan jsonb,
  financial_forecast jsonb,
  locations jsonb,
  branding jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  overall_score int check (overall_score between 0 and 100),
  market_fit jsonb,
  swot jsonb,
  budget_check jsonb,
  competitors jsonb,
  recommendations jsonb,
  sources jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.market_data (
  id uuid primary key default gen_random_uuid(),
  sector text not null,
  region text not null,
  metric text not null,
  value numeric not null,
  unit text,
  year int,
  source_name text,
  source_url text
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (length(content) > 0),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists profiles_track_idx on public.profiles (track);
create index if not exists businesses_owner_idx on public.businesses (owner_id);
create index if not exists analyses_business_idx on public.analyses (business_id, created_at desc);
create index if not exists transactions_business_date_idx on public.transactions (business_id, date desc);
create index if not exists market_data_sector_region_idx on public.market_data (sector, region);
create index if not exists messages_receiver_idx on public.messages (receiver_id, read);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at);

-- ---------------------------------------------------------------------------
-- Create a profile row automatically for every new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.analyses enable row level security;
alter table public.transactions enable row level security;
alter table public.market_data enable row level security;
alter table public.messages enable row level security;

-- profiles: readable by every signed-in user, writable only by the owner
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- businesses: owner only
drop policy if exists "businesses_all_own" on public.businesses;
create policy "businesses_all_own" on public.businesses
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- analyses: owner of the parent business
drop policy if exists "analyses_all_own" on public.analyses;
create policy "analyses_all_own" on public.analyses
  for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ));

-- transactions: owner of the parent business
drop policy if exists "transactions_all_own" on public.transactions;
create policy "transactions_all_own" on public.transactions
  for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = (select auth.uid())
  ));

-- market_data: read-only reference data (writes go through the SQL editor / service role)
drop policy if exists "market_data_select_authenticated" on public.market_data;
create policy "market_data_select_authenticated" on public.market_data
  for select to authenticated using (true);

-- messages: visible to sender and receiver; only the receiver can mark as read
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages
  for select to authenticated
  using ((select auth.uid()) in (sender_id, receiver_id));

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender" on public.messages
  for insert to authenticated with check ((select auth.uid()) = sender_id);

drop policy if exists "messages_update_receiver" on public.messages;
create policy "messages_update_receiver" on public.messages
  for update to authenticated
  using ((select auth.uid()) = receiver_id)
  with check ((select auth.uid()) = receiver_id);

-- ---------------------------------------------------------------------------
-- Realtime (chat)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for logos/banners, private bucket for uploaded plans.
-- Files are stored under a folder named after the user id.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true), ('plans', 'plans', false)
on conflict (id) do nothing;

drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding_insert_own_folder" on storage.objects;
create policy "branding_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "plans_select_own_folder" on storage.objects;
create policy "plans_select_own_folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'plans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "plans_insert_own_folder" on storage.objects;
create policy "plans_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'plans' and (storage.foldername(name))[1] = (select auth.uid())::text);
