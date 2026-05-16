'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getInitials, formatXP } from '@/lib/utils';
import type { Profile } from '@/types';

interface HeaderProps {
  profile?: Profile | null;
  onSignOut?: () => void;
}

export function Header({ profile, onSignOut }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2d2d4e] bg-[#0f0f1a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-2xl">⚔️</span>
          <span className="font-bold text-base text-gradient-purple hidden sm:block">
            Prompt Battle Arena
          </span>
        </button>

        <nav className="flex items-center gap-4">
          <button
            onClick={() => router.push('/leaderboard')}
            className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm font-medium transition-colors hidden sm:block"
          >
            Classement
          </button>

          {profile && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-[#e2e8f0]">
                  {profile.username || 'Joueur'}
                </span>
                <span className="text-xs text-[#7c3aed] font-semibold">
                  {formatXP(profile.xp)} XP
                </span>
              </div>

              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(profile.username)
                  )}
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 overflow-hidden">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full px-4 py-2.5 text-sm text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#2d2d4e] text-left transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[#2d2d4e] text-left transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
