create table public.games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null check (cat in ('ARCADE','PUZZLE','SHOOTER','VERSUS')),
  cover text not null,
  color text not null check (color in ('cyan','magenta','yellow','green')),
  plays text not null default '0',
  sort int not null default 0
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  player_name text not null check (char_length(player_name) between 1 and 20),
  score int not null check (score >= 0),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create index scores_game_score_idx on public.scores (game_id, score desc);

alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select_all" on public.games
  for select
  to anon, authenticated
  using (true);

create policy "scores_select_all" on public.scores
  for select
  to anon, authenticated
  using (true);
