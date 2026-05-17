'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatXP } from '@/lib/utils';
import type { Profile } from '@/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const [{ data: profileData }, { data: leaderboardData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false })
          .limit(50),
      ]);

      setCurrentUser(profileData);
      setProfiles(leaderboardData || []);
      setLoading(false);
    };

    load();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
      </div>
    );
  }

  const myRank = profiles.findIndex((p) => p.id === currentUser?.id) + 1;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Header profile={currentUser || undefined} />

      <main className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#e2e8f0] mb-2">🏆 Classement Global</h1>
          <p className="text-[#94a3b8]">Les meilleurs prompts battlers de l&apos;arène</p>
          {myRank > 0 && (
            <Badge variant="purple" className="mt-3">
              Ton rang : {getRankIcon(myRank)}
            </Badge>
          )}
        </div>

        {/* Top 3 podium */}
        {profiles.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {/* 2nd place */}
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">🥈</div>
              {profiles[1]?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profiles[1].avatar_url} alt="" className="w-14 h-14 rounded-full border-2 border-[#94a3b8]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#94a3b8] flex items-center justify-center text-[#0f0f1a] font-bold text-xl">
                  {profiles[1]?.username?.[0] || '?'}
                </div>
              )}
              <p className="text-sm font-semibold text-[#e2e8f0] mt-2">{profiles[1]?.username || 'Joueur'}</p>
              <p className="text-xs text-[#94a3b8]">{formatXP(profiles[1]?.xp || 0)} XP</p>
              <div className="w-20 h-16 bg-[#94a3b8]/20 border border-[#94a3b8]/30 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-[#94a3b8] font-bold">2</span>
              </div>
            </div>

            {/* 1st place */}
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-2 animate-bounce-subtle">🥇</div>
              {profiles[0]?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profiles[0].avatar_url} alt="" className="w-20 h-20 rounded-full border-2 border-[#f59e0b] glow-purple" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#f59e0b] flex items-center justify-center text-[#0f0f1a] font-bold text-2xl glow-purple">
                  {profiles[0]?.username?.[0] || '?'}
                </div>
              )}
              <p className="text-base font-bold text-[#e2e8f0] mt-2">{profiles[0]?.username || 'Joueur'}</p>
              <p className="text-sm text-[#f59e0b]">{formatXP(profiles[0]?.xp || 0)} XP</p>
              <div className="w-20 h-24 bg-[#f59e0b]/20 border border-[#f59e0b]/30 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-[#f59e0b] font-bold text-xl">1</span>
              </div>
            </div>

            {/* 3rd place */}
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">🥉</div>
              {profiles[2]?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profiles[2].avatar_url} alt="" className="w-14 h-14 rounded-full border-2 border-[#cd7f32]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#cd7f32] flex items-center justify-center text-[#0f0f1a] font-bold text-xl">
                  {profiles[2]?.username?.[0] || '?'}
                </div>
              )}
              <p className="text-sm font-semibold text-[#e2e8f0] mt-2">{profiles[2]?.username || 'Joueur'}</p>
              <p className="text-xs text-[#94a3b8]">{formatXP(profiles[2]?.xp || 0)} XP</p>
              <div className="w-20 h-12 bg-[#cd7f32]/20 border border-[#cd7f32]/30 rounded-t-lg mt-2 flex items-center justify-center">
                <span className="text-[#cd7f32] font-bold">3</span>
              </div>
            </div>
          </div>
        )}

        {/* Full list */}
        <Card className="divide-y divide-[#2d2d4e]">
          {profiles.map((profile, index) => {
            const rank = index + 1;
            const isMe = profile.id === currentUser?.id;

            return (
              <div
                key={profile.id}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  isMe ? 'bg-[#7c3aed]/10' : 'hover:bg-[#1a1a2e]/50'
                }`}
              >
                <div className="w-10 text-center font-bold text-lg">
                  {rank <= 3 ? (
                    <span>{getRankIcon(rank)}</span>
                  ) : (
                    <span className="text-[#64748b]">#{rank}</span>
                  )}
                </div>

                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || ''}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold">
                    {profile.username?.[0] || '?'}
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isMe ? 'text-[#7c3aed]' : 'text-[#e2e8f0]'}`}>
                      {profile.username || 'Joueur'}
                    </span>
                    {isMe && <Badge variant="purple" size="sm">Toi</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#64748b] mt-0.5">
                    <span>{profile.games_played} parties</span>
                    <span>•</span>
                    <span>{profile.total_wins} victoires</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-[#7c3aed]">{formatXP(profile.xp)} XP</div>
                  <div className="text-xs text-[#64748b]">Niv. {Math.floor(profile.xp / 500) + 1}</div>
                </div>
              </div>
            );
          })}

          {profiles.length === 0 && (
            <div className="p-12 text-center text-[#94a3b8]">
              <div className="text-5xl mb-4">🏜️</div>
              <p>Aucun joueur pour l&apos;instant</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
