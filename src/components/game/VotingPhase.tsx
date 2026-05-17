'use client';

import { useState } from 'react';
import { Timer } from '@/components/ui/Timer';
import type { Room, Round, Prompt, Vote, Profile } from '@/types';

interface VotingPhaseProps {
  room: Room;
  currentUser: Profile;
  currentRound: Round | null;
  prompts: Prompt[];
  votes: Vote[];
  myVote: Vote | null;
  onRefresh: () => void;
}

export function VotingPhase({
  room,
  currentUser,
  currentRound,
  prompts,
  votes,
  myVote,
  onRefresh,
}: VotingPhaseProps) {
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const visiblePrompts = prompts.filter((p) => p.image_url && !p.is_moderated);

  const handleVote = async (promptId: string) => {
    if (myVote || voting || !currentRound) return;
    setVoting(promptId);
    setError('');

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: currentRound.id,
          prompt_id: promptId,
        }),
      });

      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Impossible de voter');
        setVoting(null);
      }
    } catch {
      setError('Erreur de connexion');
      setVoting(null);
    }
  };

  const getVoteCount = (promptId: string) =>
    votes.filter((v) => v.prompt_id === promptId).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-[#7c3aed] font-semibold uppercase tracking-wider mb-1">
            Manche {room.current_round} / {room.rounds_total}
          </p>
          <h2 className="text-2xl font-black text-[#e2e8f0]">
            Vote pour la meilleure image !
          </h2>
          <p className="text-[#94a3b8] text-sm mt-1">{currentRound?.theme}</p>
        </div>
        <Timer endsAt={room.phase_ends_at} totalSeconds={30} onExpire={onRefresh} />
      </div>

      {myVote && (
        <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] px-4 py-2.5 rounded-xl text-sm mb-6">
          <span>✓</span>
          <span>Ton vote a été enregistré ! En attente des autres joueurs...</span>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* Images grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visiblePrompts.map((prompt) => {
          const isMyPrompt = prompt.player_id === currentUser.id;
          const isVoted = myVote?.prompt_id === prompt.id;
          const voteCount = getVoteCount(prompt.id);
          const canVote = !myVote && !isMyPrompt;

          return (
            <div
              key={prompt.id}
              className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                isVoted
                  ? 'border-[#7c3aed] shadow-lg'
                  : canVote
                  ? 'border-[#2d2d4e] hover:border-[#7c3aed]/60 cursor-pointer'
                  : 'border-[#2d2d4e]'
              }`}
              style={{
                boxShadow: isVoted ? '0 0 30px rgba(124, 58, 237, 0.4)' : undefined,
              }}
              onClick={() => canVote && handleVote(prompt.id)}
            >
              {/* Image */}
              <div className="aspect-square relative bg-[#1a1a2e]">
                <img
                  src={prompt.image_url!}
                  alt="Image générée"
                  className="w-full h-full object-cover"
                />

                {/* Vote overlay */}
                {canVote && !voting && (
                  <div className="absolute inset-0 bg-[#7c3aed]/0 hover:bg-[#7c3aed]/20 flex items-center justify-center transition-all duration-200">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-[#7c3aed] text-white font-bold px-6 py-3 rounded-xl text-lg">
                      Voter ✋
                    </div>
                  </div>
                )}

                {voting === prompt.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {isVoted && (
                  <div className="absolute top-3 right-3 w-10 h-10 bg-[#7c3aed] rounded-full flex items-center justify-center text-white text-lg font-bold">
                    ✓
                  </div>
                )}

                {isMyPrompt && (
                  <div className="absolute top-3 left-3 bg-[#0f0f1a]/80 text-[#7c3aed] text-xs font-medium px-2 py-1 rounded-full border border-[#7c3aed]/40">
                    Ton image
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">
                    {isMyPrompt ? 'Toi' : (prompt.profile?.username || 'Joueur')}
                  </p>
                  {myVote && (
                    <p className="text-xs text-[#94a3b8] italic truncate max-w-[200px]">
                      &ldquo;{prompt.content}&rdquo;
                    </p>
                  )}
                </div>
                {myVote && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">🗳️</span>
                    <span className="font-bold text-[#e2e8f0]">{voteCount}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Votes progress */}
      {myVote && (
        <div className="mt-6 bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-4">
          <p className="text-sm text-[#94a3b8]">
            {votes.length} vote(s) enregistré(s) sur{' '}
            {visiblePrompts.length > 0 ? Math.max(1, visiblePrompts.length - 1) : 0} possible(s)
          </p>
        </div>
      )}
    </div>
  );
}
