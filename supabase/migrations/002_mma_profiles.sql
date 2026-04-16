-- MarketMyApp profiles table (separate from PadelUp's profiles table)
-- Safe to run on a shared Supabase project

-- 1. Create mma_profiles
create table if not exists mma_profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  plan_tier text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  plans_generated int default 0,
  health_score int,
  current_streak int default 0,
  longest_streak int default 0,
  created_at timestamptz default now()
);

-- 2. RLS
alter table mma_profiles enable row level security;

create policy if not exists "mma: users can view own profile" on mma_profiles
  for select using (auth.uid() = id);

create policy if not exists "mma: users can update own profile" on mma_profiles
  for update using (auth.uid() = id);

-- 3. Drop and recreate plans/weekly_actions/usage (all empty, fixing broken FK from initial migration)
drop table if exists weekly_actions;
drop table if exists usage;
drop table if exists plans;

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references mma_profiles(id) on delete cascade,
  app_name text not null,
  input_data jsonb not null,
  plan_content jsonb not null,
  plan_markdown text,
  health_score int,
  pdf_url text,
  status text default 'completed',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table plans enable row level security;

create policy if not exists "mma: users can view own plans" on plans
  for select using (auth.uid() = user_id);

create policy if not exists "mma: users can insert own plans" on plans
  for insert with check (auth.uid() = user_id);

-- 4. Weekly actions
create table weekly_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  user_id uuid references mma_profiles(id) on delete cascade,
  week_number int not null,
  actions jsonb not null,
  committed_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table weekly_actions enable row level security;

create policy if not exists "mma: users can view own weekly actions" on weekly_actions
  for select using (auth.uid() = user_id);

create policy if not exists "mma: users can insert own weekly actions" on weekly_actions
  for insert with check (auth.uid() = user_id);

create policy if not exists "mma: users can update own weekly actions" on weekly_actions
  for update using (auth.uid() = user_id);

-- 5. Usage
create table usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references mma_profiles(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table usage enable row level security;

create policy if not exists "mma: users can insert own usage" on usage
  for insert with check (auth.uid() = user_id);

-- 6. Auto-create mma_profile on signup (separate trigger from PadelUp's)
create or replace function public.handle_new_mma_user()
returns trigger as $$
begin
  insert into public.mma_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_mma_user_created on auth.users;
create trigger on_mma_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_mma_user();
