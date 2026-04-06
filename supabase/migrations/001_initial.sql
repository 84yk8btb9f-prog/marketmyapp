create table profiles (
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

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
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

create table weekly_actions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  week_number int not null,
  actions jsonb not null,
  committed_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  action text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table plans enable row level security;
alter table weekly_actions enable row level security;
alter table usage enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can view own plans" on plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own plans" on plans
  for insert with check (auth.uid() = user_id);

create policy "Users can view own weekly actions" on weekly_actions
  for select using (auth.uid() = user_id);

create policy "Users can insert own weekly actions" on weekly_actions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own weekly actions" on weekly_actions
  for update using (auth.uid() = user_id);

create policy "Users can insert own usage" on usage
  for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
