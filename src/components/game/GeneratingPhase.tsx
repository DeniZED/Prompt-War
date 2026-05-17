'use client';

import { useEffect } from 'react';
import type { Room, Round, Prompt, Profile } from '@/types';

interface GeneratingPhaseProps {
  room: Room;
  currentUser: Profile;
  currentRound: Round | null;
  prompts: Prompt[];
  onRefresh: () => void;
}

export function GeneratingPhase({ room, currentRound, prompts, onRefresh }: GeneratingPhaseProps) {
  const totalPrompts = prompts.length;
  const generatedCount = prompts.filter((p) => p.image_url && !p.is_generating).length;
  const allGenerated = generatedCount === totalPrompts && totalPrompts > 0;

  useEffect(() => {
    if (allGenerated) return;
    const interval = setInterval(onRefresh, 3000);
    return () => clearInterval(interval);
  }, [allGenerated, onRefresh]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="mb-8 animate-fade-in">
        <p className="text-xs text-[#7c3aed] font-semibold uppercase tracking-wider mb-1">
          Manche {room.current_round} / {room.rounds_total}
        </p>
        <h2 className="text-2xl font-black text-[#e2e8f0] mb-2">
          L&apos;IA génère les images...
        </h2>
        <p className="text-[#94a3b8]">
          {currentRound?.theme}
        </p>
      </div>

      {/* Progress */}
      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#94a3b8]">Images générées</span>
          <span className="text-sm font-bold text-[#e2e8f0]">
            {generatedCount} / {totalPrompts}
          </span>
        </div>
        <div className="h-2 bg-[#2d2d4e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-full transition-all duration-500"
            style={{ width: `${totalPrompts > 0 ? (generatedCount / totalPrompts) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Generating cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {prompts.map((prompt, index) => (
          <div
            key={prompt.id}
            className="aspect-square rounded-xl overflow-hidden border border-[#2d2d4e] relative"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {prompt.image_url ? (
              <>
                <img
                  src={prompt.image_url}
                  alt="Image générée"
                  className="w-full h-full object-cover animate-scale-in"
                />
                <div className="absolute inset-0 flex items-end">
                  <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-white text-xs font-medium">
                      {prompt.profile?.username || 'Joueur'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-[#1a1a2e] flex flex-col items-center justify-center gap-2">
                {prompt.is_moderated ? (
                  <>
                    <span className="text-2xl">🚫</span>
                    <span className="text-xs text-[#94a3b8]">Modéré</span>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                      <div
                        className="absolute inset-0 w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin"
                        style={{ animationDelay: '0.3s', animationDirection: 'reverse' }}
                      />
                    </div>
                    <div className="animate-shimmer w-16 h-2 rounded" />
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Placeholder if no prompts yet */}
        {totalPrompts === 0 && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-xl animate-shimmer" />
            ))}
          </>
        )}
      </div>

      {allGenerated ? (
        <div className="animate-scale-in">
          <div className="inline-flex items-center gap-2 bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 px-6 py-3 rounded-full font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            Toutes les images sont prêtes ! Vote en cours...
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-[#94a3b8] text-sm">
          <span className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
          Génération en cours, patience...
        </div>
      )}
    </div>
  );
}
