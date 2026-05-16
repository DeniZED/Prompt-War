export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  xp: number;
  total_wins: number;
  total_votes_received: number;
  games_played: number;
  created_at: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export type GamePhase =
  | 'lobby'
  | 'prompting'
  | 'generating'
  | 'voting'
  | 'results'
  | 'finished';

export interface Room {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  max_players: number;
  rounds_total: number;
  current_round: number;
  current_phase: GamePhase;
  phase_ends_at: string | null;
  created_at: string;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  joined_at: string;
  is_ready: boolean;
  profile?: Profile;
}

export interface Round {
  id: string;
  room_id: string;
  round_number: number;
  theme: string;
  started_at: string;
  finished_at: string | null;
}

export interface Prompt {
  id: string;
  round_id: string;
  player_id: string;
  content: string;
  image_url: string | null;
  is_generating: boolean;
  is_moderated: boolean;
  submitted_at: string;
  profile?: Profile;
  vote_count?: number;
}

export interface Vote {
  id: string;
  round_id: string;
  voter_id: string;
  prompt_id: string;
  voted_at: string;
}

export interface RoundScore {
  id: string;
  round_id: string;
  player_id: string;
  votes_received: number;
  xp_earned: number;
  profile?: Profile;
}

export interface GameState {
  room: Room;
  players: RoomPlayer[];
  currentRound: Round | null;
  prompts: Prompt[];
  votes: Vote[];
  scores: RoundScore[];
  myPrompt: Prompt | null;
  myVote: Vote | null;
}

export interface CreateRoomRequest {
  rounds_total: number;
  max_players: number;
}

export interface CreateRoomResponse {
  room: Room;
}

export interface JoinRoomResponse {
  room: Room;
  player: RoomPlayer;
}

export interface SubmitPromptRequest {
  round_id: string;
  content: string;
}

export interface SubmitVoteRequest {
  round_id: string;
  prompt_id: string;
}

export interface GenerateThemeResponse {
  theme: string;
}

export interface GenerateImageRequest {
  prompt_id: string;
  prompt: string;
}

export interface GenerateImageResponse {
  image_url: string;
}

export interface LeaderboardEntry {
  profile: Profile;
  rank: number;
}
