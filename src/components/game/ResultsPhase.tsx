'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import type { Room, RoomPlayer, Round, Prompt, Vote, RoundScore, Profile } from '@/types';

interface ResultsPhaseProps {
  room: Room;
  players: RoomPlayer[];
  currentUser: Profile;
  isHost: boolean;
  currentRound: Round | null;
  prompts: Prompt[];
  votes: Vote[];
  scores: RoundScore[];
  onRefresh: () => void;
  isFinal?: boolean;
}

export function ResultsPhase({
  room,
  players,
  currentUser,
  isHost,
  currentRound,
  prompts,
  votes,
  scores,
  onRefresh,
  isFinal = false,
}: ResultsPhaseProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);

  const sortedPrompts = [...prompts]
    .filter((p) => p.image_url)
    .sort((a, b) => {
      const aVotes = votes.filter((v) => v.prompt_id === a.id).length;
      const bVotes = votes.filter((v) => v.prompt_id === b.id).length;
      return bVotes - aVotes;
    });

  const winner = sortedPrompts[0];
  const winnerVotes = winner ? votes.filter((v) => v.prompt_id === winner.id).length : 0;

  const sortedScores = [...scores].sort((a, b) => b.votes_received - a.votes_received);

  const totalScoresByPlayer = players.reduce(
    (acc, player) => {
      const playerScore = scores.find((s) => s.player_id === player.player_id);
      acc[player.player_id] = (acc[player.player_id] || 0) + (playerScore?.xp_earned || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const handleNextRound = async () => {
    setAdvancing(true);
    try {
      await fetch(`/api/rooms/${room.code}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ next_phase: 'next_round' }),
      });
      onRefresh();
    } catch {
      setAdvancing(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <p className="text-xs text-[#7c3aed] font-semibold uppercase tracking-wider mb-2">
          {isFinal ? 'Fin de la partie' : `Résultats — Manche ${room.current_round}`}
        </p>
        <h2 className="text-3xl font-black text-[#e2e8f0]">
          {isFinal ? '🏆 Classement Final' : '🎉 Résultats du round'}
        </h2>
        {currentRound && (
          <p className="text-[#94a3b8] mt-2">{currentRound.theme}</p>
        )}
      </div>

      {/* Winner spotlight */}
      {winner && winnerVotes > 0 && (
        <div className="mb-8 animate-scale-in">
          <div className="bg-gradient-to-br from-[#f59e0b]/20 to-[#7c3aed]/20 border border-[#f59e0b]/40 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👑</span>
              <span className="text-[#f59e0b] font-bold">Gagnant du round</span>
            </div>
            <div className="flex gap-4">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#f59e0b]/60">
                <img
                  src={winner.image_url!}
                  alt="Image gagnante"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl text-[#e2e8f0] mb-1">
                  {winner.profile?.username || 'Joueur'}
                  {winner.player_id === currentUser.id && (
                    <span className="ml-2 text-sm text-[#7c3aed]">(toi !)</span>
                  )}
                </p>
                <p className="text-[#94a3b8] text-sm italic mb-3">
                  &ldquo;{winner.content}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-[#f59e0b]">
                    {winnerVotes} vote{winnerVotes > 1 ? 's' : ''}
                  </span>
                  <span className="text-sm text-[#10b981] font-semibold">
                    +{winnerVotes * 10 + 50} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All images with vote counts */}
      {sortedPrompts.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {sortedPrompts.map((prompt, index) => {
            const voteCount = votes.filter((v) => v.prompt_id === prompt.id).length;
            const isWinner = index === 0 && voteCount > 0;

            return (
              <div
                key={prompt.id}
                className={`relative rounded-xl overflow-hidden border ${
                  isWinner ? 'border-[#f59e0b]/60' : 'border-[#2d2d4e]'
                }`}
              >
                <div className="aspect-square">
                  <img
                    src={prompt.image_url!}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/70 text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <div className="bg-[#1a1a2e] px-3 py-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-[#e2e8f0] truncate">
                    {prompt.profile?.username || 'Joueur'}
                  </p>
                  <span className="text-xs text-[#94a3b8]">
                    {voteCount} 🗳️
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scores table */}
      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-[#2d2d4e]">
          <h3 className="font-bold text-[#e2e8f0]">
            {isFinal ? 'Classement final' : 'Scores du round'}
          </h3>
        </div>
        <div className="divide-y divide-[#2d2d4e]">
          {players
            .sort((a, b) => {
              const aScore = sortedScores.find((s) => s.player_id === a.player_id);
              const bScore = sortedScores.find((s) => s.player_id === b.player_id);
              return (bScore?.votes_received || 0) - (aScore?.votes_received || 0);
            })
            .map((player, index) => {
              const score = sortedScores.find((s) => s.player_id === player.player_id);
              const isMe = player.player_id === currentUser.id;
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    isMe ? 'bg-[#7c3aed]/10' : ''
                  }`}
                >
                  <span className="text-xl w-8 text-center">
                    {medals[index] || `${index + 1}`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                    {player.profile?.avatar_url ? (
                      <img
                        src={player.profile.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(player.profile?.username)
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#e2e8f0] text-sm">
                      {player.profile?.username || 'Joueur'}
                      {isMe && <span className="ml-1 text-xs text-[#7c3aed]">(moi)</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#e2e8f0]">
                      {score?.votes_received || 0} vote{(score?.votes_received || 0) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-[#10b981]">+{score?.xp_earned || 0} XP</p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Actions */}
      {isFinal ? (
        <div className="space-y-3">
          <button
            onClick={handleBackToDashboard}
            className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
          >
            Retour au Dashboard
          </button>
        </div>
      ) : isHost ? (
        <button
          onClick={handleNextRound}
          disabled={advancing}
          className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}
        >
          {advancing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Passage au round suivant...
            </span>
          ) : (
            `Round suivant →`
          )}
        </button>
      ) : (
        <div className="text-center text-[#94a3b8] text-sm flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          En attente de l&apos;hôte pour le round suivant...
        </div>
      )}
    </div>
  );
}
