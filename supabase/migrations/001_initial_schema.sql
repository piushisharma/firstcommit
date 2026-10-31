-- ─────────────────────────────────────────────────────────────────
-- FirstCommit — Initial Schema
-- Run in Supabase SQL editor or via supabase db push
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  github_username text,
  avatar_url      text,
  created_at      timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, github_username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── saved_repos ─────────────────────────────────────────────────
create table if not exists public.saved_repos (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  owner        text not null,
  repo         text not null,
  summary_json jsonb,
  created_at   timestamptz default now() not null,
  unique(user_id, owner, repo)
);

alter table public.saved_repos enable row level security;

create policy "Users manage their own saved repos"
  on public.saved_repos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── saved_issues ────────────────────────────────────────────────
create table if not exists public.saved_issues (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  owner        text not null,
  repo         text not null,
  issue_number integer not null,
  title        text not null,
  difficulty   text check (difficulty in ('Easy', 'Medium', 'Hard')),
  created_at   timestamptz default now() not null,
  unique(user_id, owner, repo, issue_number)
);

alter table public.saved_issues enable row level security;

create policy "Users manage their own saved issues"
  on public.saved_issues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── roadmaps ────────────────────────────────────────────────────
create table if not exists public.roadmaps (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  owner        text not null,
  repo         text not null,
  issue_number integer,
  title        text not null,
  created_at   timestamptz default now() not null
);

alter table public.roadmaps enable row level security;

create policy "Users manage their own roadmaps"
  on public.roadmaps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── roadmap_steps ───────────────────────────────────────────────
create table if not exists public.roadmap_steps (
  id          uuid primary key default uuid_generate_v4(),
  roadmap_id  uuid not null references public.roadmaps(id) on delete cascade,
  position    integer not null,
  title       text not null,
  description text,
  done        boolean default false not null,
  done_at     timestamptz,
  unique(roadmap_id, position)
);

alter table public.roadmap_steps enable row level security;

create policy "Users manage steps of their own roadmaps"
  on public.roadmap_steps for all
  using (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.roadmaps r
      where r.id = roadmap_id and r.user_id = auth.uid()
    )
  );

-- ─── cache ───────────────────────────────────────────────────────
-- Accessed only via service role; no RLS policies intentionally allow user access
create table if not exists public.cache (
  key        text primary key,
  value      jsonb not null,
  expires_at timestamptz not null
);

alter table public.cache enable row level security;
-- No user-facing RLS policies — service role bypasses RLS

-- Index for TTL cleanup
create index if not exists cache_expires_at_idx on public.cache(expires_at);
