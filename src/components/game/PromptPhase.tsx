'use client';

import { useState } from 'react';
import { Timer } from '@/components/ui/Timer';
import type { Room, RoomPlayer, Round, Prompt, Profile } from '@/types';

interface PromptPhaseProps {
  room: Room;
  players: RoomPlayer[];
  currentUser: Profile;
  currentRound: Round | null;
  prompts: Prompt[];
  myPrompt: Prompt | null;
  onRefresh: () => void;
}

export function PromptPhase({
  room,
  players,
  currentUser,
  currentRound,
  prompts,
  myPrompt,
  onRefresh,
}: PromptPhaseProps) {
  const [promptText, setPromptText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!myPrompt);
  const [error, setError] = useState('');

  const MAX_CHARS = 200;
  const submittedCount = prompts.length;

  const handleSubmit = async () => {
    if (!promptText.trim() || !currentRound || submitting) return;
    if (promptText.length > MAX_CHARS) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round_id: currentRound.id,
          content: promptText.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        onRefresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Impossible de soumettre');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !submitted) {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs text-[#7c3aed] font-semibold uppercase tracking-wider mb-1">
            Manche {room.current_round} / {room.rounds_total}
          </p>
          <h2 className="text-lg font-bold text-[#e2e8f0]">Phase de prompt</h2>
        </div>
        <Timer
          endsAt={room.phase_ends_at}
          totalSeconds={60}
          onExpire={onRefresh}
        />
      </div>

      {/* Theme */}
      <div className="bg-gradient-to-br from-[#7c3aed]/20 to-[#06b6d4]/10 border border-[#7c3aed]/40 rounded-2xl p-6 mb-8 animate-fade-in">
        <p className="text-xs text-[#7c3aed] font-semibold uppercase tracking-wider mb-3">
          Thème imposé
        </p>
        <p className="text-xl md:text-2xl font-black text-[#e2e8f0] leading-tight">
          {currentRound?.theme || 'Chargement du thème...'}
        </p>
      </div>

      {submitted ? (
        <div className="animate-scale-in">
          <div className="bg-[#1a1a2e] border border-[#10b981]/40 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-[#10b981] mb-2">Prompt soumis !</h3>
            <p className="text-[#94a3b8] text-sm mb-4">
              L&apos;IA va générer ton image...
            </p>
            {myPrompt && (
              <div className="bg-[#0f0f1a] rounded-xl p-4 text-left">
                <p className="text-xs text-[#64748b] mb-1">Ton prompt :</p>
                <p className="text-[#e2e8f0] text-sm italic">&ldquo;{myPrompt.content}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Player submission status */}
          <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-4">
            <p className="text-sm text-[#94a3b8] mb-3">
              {submittedCount} / {players.length} joueur(s) ont soumis leur prompt
            </p>
            <div className="flex gap-2 flex-wrap">
              {players.map((player) => {
                const hasSubmitted = prompts.some((p) => p.player_id === player.player_id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      hasSubmitted
                        ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-[#2d2d4e] text-[#64748b]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasSubmitted ? 'bg-[#10b981]' : 'bg-[#64748b]'
                      }`}
                    />
                    {player.profile?.username || 'Joueur'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="relative mb-4">
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décris ce que tu veux créer... Sois créatif !"
              maxLength={MAX_CHARS}
              rows={4}
              disabled={submitting}
              className="w-full bg-[#1a1a2e] border border-[#2d2d4e] focus:border-[#7c3aed] rounded-xl px-4 py-3 text-[#e2e8f0] placeholder-[#64748b] resize-none transition-colors outline-none text-sm"
            />
            <div
              className={`absolute bottom-3 right-3 text-xs tabular-nums ${
                promptText.length > MAX_CHARS * 0.9
                  ? 'text-red-400'
                  : 'text-[#64748b]'
              }`}
            >
              {promptText.length}/{MAX_CHARS}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!promptText.trim() || submitting || promptText.length > MAX_CHARS}
            className="w-full py-4 rounded-xl font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              boxShadow: promptText.trim() ? '0 0 20px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </span>
            ) : (
              'Soumettre mon prompt ✨'
            )}
          </button>
          <p className="text-center text-xs text-[#64748b] mt-2">
            Ctrl+Entrée pour soumettre rapidement
          </p>
        </div>
      )}
    </div>
  );
}
