'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatXP } from '@/lib/utils';
import type { Profile } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
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

      setProfile(profileData);
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError('');

    const code = joinCode.trim().toUpperCase();

    try {
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setJoinError(data.error || 'Impossible de rejoindre cette salle');
        setJoining(false);
        return;
      }

      router.push(`/room/${code}`);
    } catch {
      setJoinError('Erreur de connexion');
      setJoining(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
      </div>
    );
  }

  const xpLevel = profile ? Math.floor(profile.xp / 500) + 1 : 1;
  const xpProgress = profile ? (profile.xp % 500) / 500 * 100 : 0;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Header profile={profile} onSignOut={handleSignOut} />

      <main className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
        {/* Welcome Banner */}
        <div className="glass rounded-2xl p-6 border border-[#2d2d4e] mb-8">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.username || 'Avatar'}
                className="w-16 h-16 rounded-full border-2 border-[#7c3aed]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-2xl font-bold">
                {profile?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#e2e8f0]">
                Bienvenue, {profile?.username || 'Joueur'} !
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="purple">Niveau {xpLevel}</Badge>
                <span className="text-sm text-[#94a3b8]">{formatXP(profile?.xp || 0)} XP</span>
              </div>
              {/* XP Progress bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#2d2d4e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <span className="text-xs text-[#64748b]">{(profile?.xp ?? 0) % 500}/500 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-black text-[#7c3aed]">{formatXP(profile?.xp || 0)}</div>
            <div className="text-sm text-[#94a3b8] mt-1">XP Total</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black text-[#10b981]">{profile?.total_wins || 0}</div>
            <div className="text-sm text-[#94a3b8] mt-1">Victoires</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-black text-[#06b6d4]">{profile?.games_played || 0}</div>
            <div className="text-sm text-[#94a3b8] mt-1">Parties jouées</div>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Room */}
          <Card className="flex flex-col items-center text-center p-8 card-hover cursor-pointer border-[#7c3aed] border-opacity-30"
            onClick={() => router.push('/room/create')}>
            <div className="text-6xl mb-4">🏟️</div>
            <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Créer une salle</h2>
            <p className="text-[#94a3b8] text-sm mb-6">
              Configure ta partie et invite tes amis avec un code unique.
            </p>
            <Button variant="primary" className="w-full" onClick={() => router.push('/room/create')}>
              Créer une salle →
            </Button>
          </Card>

          {/* Join Room */}
          <Card className="flex flex-col items-center text-center p-8">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-xl font-bold text-[#e2e8f0] mb-2">Rejoindre une salle</h2>
            <p className="text-[#94a3b8] text-sm mb-4">
              Entre le code à 6 caractères partagé par l&apos;hôte.
            </p>
            <div className="w-full space-y-3">
              <Input
                placeholder="Code (ex: XK7P2Q)"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                maxLength={6}
                className="text-center text-xl font-mono tracking-widest uppercase"
              />
              {joinError && (
                <p className="text-sm text-[#ef4444]">{joinError}</p>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleJoinRoom}
                disabled={joining || joinCode.length !== 6}
              >
                {joining ? 'Connexion...' : 'Rejoindre →'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Leaderboard Link */}
        <Card className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-semibold text-[#e2e8f0]">Classement global</h3>
              <p className="text-sm text-[#94a3b8]">Vois où tu te situes parmi tous les joueurs</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => router.push('/leaderboard')}>
            Voir →
          </Button>
        </Card>
      </main>
    </div>
  );
}
