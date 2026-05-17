'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CreateRoomPage() {
  const router = useRouter();
  const [rounds, setRounds] = useState(3);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rounds_total: rounds,
          max_players: maxPlayers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la création de la salle');
        setCreating(false);
        return;
      }

      const { room } = await response.json();
      router.push(`/room/${room.code}`);
    } catch {
      setError('Erreur de connexion');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Header />

      <main className="max-w-xl mx-auto px-6 py-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#e2e8f0] mb-2">Créer une salle</h1>
          <p className="text-[#94a3b8]">Configure ta partie et invite tes amis</p>
        </div>

        <Card className="p-8 space-y-8">
          {/* Rounds selector */}
          <div>
            <label className="block text-[#e2e8f0] font-semibold mb-3">
              Nombre de manches
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                    rounds === n
                      ? 'bg-[#7c3aed] text-white glow-purple'
                      : 'bg-[#2d2d4e] text-[#94a3b8] hover:bg-[#3d3d5e] hover:text-[#e2e8f0]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-[#64748b] mt-2">
              Durée estimée : ~{rounds * 3} minutes
            </p>
          </div>

          {/* Max players selector */}
          <div>
            <label className="block text-[#e2e8f0] font-semibold mb-3">
              Joueurs maximum
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                    maxPlayers === n
                      ? 'bg-[#06b6d4] text-white glow-cyan'
                      : 'bg-[#2d2d4e] text-[#94a3b8] hover:bg-[#3d3d5e] hover:text-[#e2e8f0]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#0f0f1a] rounded-xl p-4 border border-[#2d2d4e]">
            <h3 className="text-sm font-semibold text-[#94a3b8] mb-3">Résumé de la partie</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Manches</span>
                <span className="text-[#e2e8f0] font-medium">{rounds}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Joueurs max</span>
                <span className="text-[#e2e8f0] font-medium">{maxPlayers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Phase de prompt</span>
                <span className="text-[#e2e8f0] font-medium">60 secondes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Phase de vote</span>
                <span className="text-[#e2e8f0] font-medium">30 secondes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">XP par vote reçu</span>
                <span className="text-[#10b981] font-medium">+10 XP</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Bonus victoire de manche</span>
                <span className="text-[#10b981] font-medium">+50 XP</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 text-sm text-[#ef4444]">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              ← Retour
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1"
            >
              {creating ? 'Création...' : 'Créer la salle 🚀'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
