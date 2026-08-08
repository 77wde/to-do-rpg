-- ============================================================================
-- QuestLog — initial schema
--
-- One row per signed-in user in `players`; quests and log entries hang off
-- auth.users by user_id. Everything is per-user private data, so every table
-- is RLS-protected with an ownership predicate.
--
-- Enum-ish columns keep the exact string values the app already uses
-- (lib/types.ts), so no mapping layer is needed on read/write.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- players — 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.players (
  id                uuid primary key references auth.users (id) on delete cascade,
  nickname          text        not null check (char_length(nickname) between 1 and 32),
  level             integer     not null default 1  check (level >= 1),
  xp                integer     not null default 0  check (xp >= 0),
  gold              integer     not null default 0  check (gold >= 0),
  hp                integer     not null default 100 check (hp >= 0),
  max_hp            integer     not null default 100 check (max_hp > 0),
  -- owned shop item ids
  owned             text[]      not null default '{}',
  equipped_skin     text        not null default 'default',
  equipped_title    text,
  -- date of the last daily reset applied
  last_daily_reset  date,
  total_completed   integer     not null default 0 check (total_completed >= 0),
  streak            integer     not null default 0 check (streak >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- quests
-- ---------------------------------------------------------------------------
create table public.quests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users (id) on delete cascade,
  title         text        not null check (char_length(title) between 1 and 200),
  category      text        not null check (category in ('inbox', 'next-action', 'calendar', 'someday-maybe', 'waiting-for')),
  -- estimated focus minutes — also the pomodoro length
  estimate_min  integer     not null check (estimate_min > 0),
  xp_reward     integer     not null default 0 check (xp_reward >= 0),
  gold_reward   integer     not null default 0 check (gold_reward >= 0),
  status        text        not null default 'todo' check (status in ('todo', 'done')),
  -- for calendar quests
  due_date      date,
  -- daily quest — resets each day and penalizes if missed
  is_daily      boolean     not null default false,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  -- a quest is completed exactly when it carries a completion timestamp
  constraint quests_completed_at_matches_status
    check ((status = 'done') = (completed_at is not null))
);

create index quests_user_id_status_idx on public.quests (user_id, status);
create index quests_user_id_category_idx on public.quests (user_id, category);

-- ---------------------------------------------------------------------------
-- activity_log — feed of recent events
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('complete', 'levelup', 'penalty', 'reward', 'surprise', 'buy', 'unlock', 'focusFail')),
  text       text        not null,
  created_at timestamptz not null default now()
);

create index activity_log_user_id_created_at_idx
  on public.activity_log (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
--
-- SECURITY INVOKER (the default) on purpose — this needs no elevated rights.
-- Returning `trigger` also means it cannot be called directly as a function.
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Every policy pairs `to authenticated` with an ownership predicate — the role
-- check alone would let any signed-in user read everyone else's rows.
-- `(select auth.uid())` is wrapped so Postgres caches it per statement
-- instead of re-evaluating it per row.
--
-- UPDATE policies carry both USING and WITH CHECK: USING picks the rows you
-- may touch, WITH CHECK stops you from reassigning them to another user.
-- ---------------------------------------------------------------------------
alter table public.players     enable row level security;
alter table public.quests      enable row level security;
alter table public.activity_log enable row level security;

-- players ------------------------------------------------------------------
create policy "players: select own" on public.players
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "players: insert own" on public.players
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "players: update own" on public.players
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "players: delete own" on public.players
  for delete to authenticated
  using ((select auth.uid()) = id);

-- quests -------------------------------------------------------------------
create policy "quests: select own" on public.quests
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "quests: insert own" on public.quests
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "quests: update own" on public.quests
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "quests: delete own" on public.quests
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- activity_log -------------------------------------------------------------
create policy "activity_log: select own" on public.activity_log
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "activity_log: insert own" on public.activity_log
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "activity_log: delete own" on public.activity_log
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Data API grants
--
-- Depending on the project's Data API settings, new tables are not always
-- reachable by the API roles. Granting explicitly keeps behaviour identical
-- across projects. `anon` gets nothing — this is all private user data.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.players      to authenticated;
grant select, insert, update, delete on public.quests       to authenticated;
grant select, insert,         delete on public.activity_log to authenticated;
