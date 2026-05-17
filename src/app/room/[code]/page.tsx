'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Lobby } from '@/components/game/Lobby';
import { PromptPhase } from '@/components/game/PromptPhase';
import { GeneratingPhase } from '@/components/game/GeneratingPhase';
import { VotingPhase } from '@/components/game/VotingPhase';
import { ResultsPhase } from '@/components/game/ResultsPhase';
import type { Room, RoomPlayer, Round, Prompt, Vote, RoundScore, Profile } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoomData = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${code}`);
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Salle introuvable');
        return;
      }

      const data = await response.json();
      setRoom(data.room);
      setPlayers(data.players || []);

      if (data.room.current_round > 0) {
        // Load current round data
        const { data: roundData } = await supabase
          .from('rounds')
          .select('*')
          .eq('room_id', data.room.id)
          .eq('round_number', data.room.current_round)
          .single();

        if (roundData) {
          setCurrentRound(roundData);

          // Load prompts for this round
          const { data: promptsData } = await supabase
            .from('prompts')
            .select('*, profile:profiles(*)')
            .eq('round_id', roundData.id);

          setPrompts(promptsData || []);

          // Load votes for this round
          const { data: votesData } = await supabase
            .from('votes')
            .select('*')
            .eq('round_id', roundData.id);

          setVotes(votesData || []);

          // Load scores for this round
          const { data: scoresData } = await supabase
            .from('round_scores')
            .select('*, profile:profiles(*)')
            .eq('round_id', roundData.id);

          setScores(scoresData || []);
        }
      }
    } catch (err) {
      console.error('Error loading room:', err);
      setError('Erreur de chargement');
    }
  }, [code, supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(profileData);
      await loadRoomData();
      setLoading(false);
    };

    init();
  }, [loadRoomData, router, supabase]);

  useEffect(() => {
    if (!room) return;

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          setRoom(payload.new as Room);
          // Reload all data when phase changes
          loadRoomData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          loadRoomData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts',
        },
        () => {
          loadRoomData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
        },
        () => {
          loadRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room?.id, loadRoomData, supabase]);

  // Phase transition management for host
  useEffect(() => {
    if (!room || !currentUser) return;
    const isHost = room.host_id === currentUser.id;
    if (!isHost) return;

    const { current_phase, phase_ends_at } = room;

    if (!phase_ends_at) return;

    const msLeft = new Date(phase_ends_at).getTime() - Date.now();
    if (msLeft <= 0) return;

    const timer = setTimeout(async () => {
      // Trigger next phase based on current phase
      let nextPhase: string | null = null;

      if (current_phase === 'prompting') {
        nextPhase = 'generating';
      } else if (current_phase === 'voting') {
        nextPhase = 'results';
      }

      if (nextPhase) {
        await fetch(`/api/rooms/${code}/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ next_phase: nextPhase }),
        });
      }
    }, msLeft);

    return () => clearTimeout(timer);
  }, [room?.current_phase, room?.phase_ends_at, currentUser?.id, code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Chargement de la salle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">Salle introuvable</h2>
          <p className="text-[#94a3b8] mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-[#7c3aed] text-white rounded-xl font-semibold hover:bg-[#6d28d9] transition-colors"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room || !currentUser) return null;

  const isHost = room.host_id === currentUser.id;
  const myPrompt = prompts.find((p) => p.player_id === currentUser.id) || null;
  const myVote = votes.find((v) => v.voter_id === currentUser.id) || null;

  const sharedProps = {
    room,
    players,
    currentUser,
    isHost,
    currentRound,
    prompts,
    votes,
    scores,
    myPrompt,
    myVote,
    onRefresh: loadRoomData,
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Header profile={currentUser} />

      {room.current_phase === 'lobby' && <Lobby {...sharedProps} roomCode={code} />}
      {room.current_phase === 'prompting' && <PromptPhase {...sharedProps} />}
      {room.current_phase === 'generating' && <GeneratingPhase {...sharedProps} />}
      {room.current_phase === 'voting' && <VotingPhase {...sharedProps} />}
      {room.current_phase === 'results' && <ResultsPhase {...sharedProps} />}
      {room.current_phase === 'finished' && <ResultsPhase {...sharedProps} isFinal />}
    </div>
  );
}
