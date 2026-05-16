-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  username text,
  avatar_url text,
  discord_id text,
  xp integer default 0,
  total_wins integer default 0,
  total_votes_received integer default 0,
  games_played integer default 0,
  created_at timestamptz default now()
);

-- Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references public.profiles,
  status text default 'waiting',  -- waiting|playing|finished
  max_players integer default 8,
  rounds_total integer default 3,
  current_round integer default 0,
  current_phase text default 'lobby', -- lobby|prompting|generating|voting|results|finished
  phase_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Room participants
create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms on delete cascade,
  player_id uuid references public.profiles,
  joined_at timestamptz default now(),
  is_ready boolean default false,
  unique(room_id, player_id)
);

-- Rounds
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms on delete cascade,
  round_number integer not null,
  theme text not null,
  started_at timestamptz default now(),
  finished_at timestamptz
);

-- Prompts submitted by players
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds on delete cascade,
  player_id uuid references public.profiles,
  content text not null,
  image_url text,
  is_generating boolean default false,
  is_moderated boolean default false,
  submitted_at timestamptz default now(),
  unique(round_id, player_id)
);

-- Votes
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds on delete cascade,
  voter_id uuid references public.profiles,
  prompt_id uuid references public.prompts on delete cascade,
  voted_at timestamptz default now(),
  unique(round_id, voter_id)
);

-- Scores per round
create table public.round_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds on delete cascade,
  player_id uuid references public.profiles,
  votes_received integer default 0,
  xp_earned integer default 0
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.rounds enable row level security;
alter table public.prompts enable row level security;
alter table public.votes enable row level security;
alter table public.round_scores enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Rooms policies
create policy "Rooms are viewable by everyone"
  on public.rooms for select using (true);

create policy "Authenticated users can create rooms"
  on public.rooms for insert with check (auth.role() = 'authenticated');

create policy "Host can update their room"
  on public.rooms for update using (auth.uid() = host_id);

-- Room players policies
create policy "Room players are viewable by everyone"
  on public.room_players for select using (true);

create policy "Authenticated users can join rooms"
  on public.room_players for insert with check (auth.role() = 'authenticated');

create policy "Players can update their own room_player record"
  on public.room_players for update using (auth.uid() = player_id);

-- Rounds policies
create policy "Rounds are viewable by everyone"
  on public.rounds for select using (true);

create policy "Authenticated users can create rounds"
  on public.rounds for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update rounds"
  on public.rounds for update using (auth.role() = 'authenticated');

-- Prompts policies
create policy "Prompts are viewable by everyone"
  on public.prompts for select using (true);

create policy "Authenticated users can submit prompts"
  on public.prompts for insert with check (auth.uid() = player_id);

create policy "System can update prompts (image_url, is_generating)"
  on public.prompts for update using (true);

-- Votes policies
create policy "Votes are viewable by everyone"
  on public.votes for select using (true);

create policy "Authenticated users can vote"
  on public.votes for insert with check (auth.uid() = voter_id);

-- Round scores policies
create policy "Round scores are viewable by everyone"
  on public.round_scores for select using (true);

create policy "Authenticated users can insert round scores"
  on public.round_scores for insert with check (auth.role() = 'authenticated');

-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, discord_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider_id'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to safely increment XP (used by service role)
create or replace function public.increment_xp(user_id uuid, xp_amount integer)
returns void as $$
begin
  update public.profiles
  set xp = xp + xp_amount
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Indexes for performance
create index idx_rooms_code on public.rooms(code);
create index idx_rooms_status on public.rooms(status);
create index idx_room_players_room_id on public.room_players(room_id);
create index idx_room_players_player_id on public.room_players(player_id);
create index idx_rounds_room_id on public.rounds(room_id);
create index idx_prompts_round_id on public.prompts(round_id);
create index idx_prompts_player_id on public.prompts(player_id);
create index idx_votes_round_id on public.votes(round_id);
create index idx_votes_voter_id on public.votes(voter_id);
create index idx_round_scores_round_id on public.round_scores(round_id);
create index idx_round_scores_player_id on public.round_scores(player_id);
