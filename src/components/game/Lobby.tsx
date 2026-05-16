'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import type { Room, RoomPlayer, Profile } from '@/types';

interface LobbyProps {
  room: Room;
  players: RoomPlayer[];
  currentUser: Profile;
  isHost: boolean;
  roomCode: string;
  onRefresh: () => void;
}

export function Lobby({ room, players, currentUser, isHost, roomCode, onRefresh }: LobbyProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const canStart = players.length >= 2;

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    setError('');
    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Impossible de démarrer');
        setStarting(false);
      }
    } catch {
      setError('Erreur de connexion');
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Room code */}
      <div className="text-center mb-10 animate-fade-in">
        <p className="text-[#94a3b8] text-sm mb-2">Code de la salle</p>
        <button
          onClick={copyCode}
          className="group inline-flex items-center gap-3 bg-[#1a1a2e] border-2 border-[#7c3aed] rounded-2xl px-8 py-4 hover:border-[#06b6d4] transition-all duration-200"
        >
          <span className="text-4xl font-black text-[#e2e8f0] tracking-widest font-mono">
            {roomCode}
          </span>
          <span className="text-[#7c3aed] group-hover:text-[#06b6d4] transition-colors text-lg">
            {copied ? '✓' : '⎘'}
          </span>
        </button>
        <p className="text-[#64748b] text-xs mt-2">
          {copied ? 'Copié !' : 'Clique pour copier'}
        </p>
      </div>

      {/* Players list */}
      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#e2e8f0]">
            Joueurs ({players.length}/{room.max_players})
          </h2>
          <div className="flex gap-1">
            {Array.from({ length: room.max_players }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i < players.length ? 'bg-[#7c3aed]' : 'bg-[#2d2d4e]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {players.map((player) => {
            const profile = player.profile;
            const isMe = player.player_id === currentUser.id;
            const isRoomHost = player.player_id === room.host_id;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isMe ? 'bg-[#7c3aed]/10 border border-[#7c3aed]/30' : 'bg-[#0f0f1a]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || '?'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.username)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e2e8f0] truncate">
                    {profile?.username || 'Joueur inconnu'}
                    {isMe && (
                      <span className="ml-2 text-xs text-[#7c3aed]">(moi)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#64748b]">{profile?.xp || 0} XP</p>
                </div>
                {isRoomHost && (
                  <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] px-2 py-1 rounded-full font-medium">
                    Hôte
                  </span>
                )}
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] flex-shrink-0" />
              </div>
            );
          })}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, room.max_players - players.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#2d2d4e]"
            >
              <div className="w-10 h-10 rounded-full bg-[#2d2d4e] flex items-center justify-center text-[#64748b] text-lg">
                +
              </div>
              <p className="text-sm text-[#64748b]">En attente d&apos;un joueur...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Game info */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-[#7c3aed]">{room.rounds_total}</div>
          <div className="text-xs text-[#94a3b8] mt-1">Manches</div>
        </div>
        <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-[#06b6d4]">60s</div>
          <div className="text-xs text-[#94a3b8] mt-1">Pour prompter</div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      {/* Actions */}
      {isHost ? (
        <div className="space-y-3">
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                : '#2d2d4e',
              color: 'white',
              boxShadow: canStart ? '0 0 30px rgba(124, 58, 237, 0.4)' : 'none',
            }}
          >
            {starting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Démarrage...
              </span>
            ) : canStart ? (
              'Lancer la partie ⚔️'
            ) : (
              'En attente de joueurs (min. 2)'
            )}
          </button>
          <button
            onClick={handleLeave}
            className="w-full py-3 rounded-xl text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1a2e] transition-colors text-sm"
          >
            Quitter la salle
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-[#94a3b8]">
            <span className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
            <span>En attente du lancement par l&apos;hôte...</span>
          </div>
          <button
            onClick={handleLeave}
            className="text-sm text-[#64748b] hover:text-[#94a3b8] transition-colors"
          >
            Quitter la salle
          </button>
        </div>
      )}
    </div>
  );
}
