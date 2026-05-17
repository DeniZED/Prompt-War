'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleDiscordLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const steps = [
    {
      icon: '✍️',
      title: 'Écris ton prompt',
      description: 'Le thème est imposé, ta créativité est libre. 60 secondes pour convaincre.',
    },
    {
      icon: '🤖',
      title: "L'IA génère",
      description: "fal.ai transforme ton prompt en une image unique. La magie opère.",
    },
    {
      icon: '🗳️',
      title: 'La communauté vote',
      description: 'Tous les joueurs votent pour la meilleure image. Anonymement.',
    },
    {
      icon: '🏆',
      title: 'Gagne des XP',
      description: 'Le gagnant empoche des points et de l\'XP. Monte dans le classement.',
    },
  ];

  return (
    <main className="min-h-screen bg-background bg-grid relative overflow-hidden">
      {/* Background glow effects */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#2d2d4e]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-bold text-lg text-gradient-purple">Prompt Battle Arena</span>
        </div>
        {!loading && (
          isLoggedIn ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-all duration-200"
            >
              Dashboard →
            </button>
          ) : (
            <button
              onClick={handleDiscordLogin}
              className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <DiscordIcon />
              Connexion
            </button>
          )
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#1a1a2e] border border-[#7c3aed] text-[#7c3aed] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block animate-pulse" />
            Bêta — Rejoins l&apos;arène maintenant
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-gradient-purple">Prompt</span>
            <br />
            <span className="text-[#e2e8f0]">Battle Arena</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#94a3b8] mb-4 max-w-2xl mx-auto">
            L&apos;IA génère, tu domines.
          </p>
          <p className="text-base md:text-lg text-[#64748b] mb-12 max-w-xl mx-auto">
            Affronte tes amis dans des batailles de prompts épiques. Thème imposé, imagination libre,
            la communauté juge.
          </p>

          {!loading && (
            isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="group relative px-10 py-5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xl font-bold rounded-2xl transition-all duration-300 glow-purple animate-bounce-subtle"
              >
                <span className="relative z-10">Entrer dans l&apos;arène →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            ) : (
              <button
                onClick={handleDiscordLogin}
                className="group relative px-10 py-5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xl font-bold rounded-2xl transition-all duration-300 flex items-center gap-3 mx-auto"
                style={{ boxShadow: '0 0 30px rgba(88, 101, 242, 0.4)' }}
              >
                <DiscordIcon size={28} />
                <span>Jouer avec Discord</span>
              </button>
            )
          )}

          {loading && (
            <div className="w-12 h-12 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin mx-auto" />
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 mt-16 text-center animate-fade-in">
          <div>
            <div className="text-3xl font-black text-[#7c3aed]">∞</div>
            <div className="text-sm text-[#64748b]">Parties jouées</div>
          </div>
          <div className="w-px h-12 bg-[#2d2d4e]" />
          <div>
            <div className="text-3xl font-black text-[#06b6d4]">2-8</div>
            <div className="text-sm text-[#64748b]">Joueurs / partie</div>
          </div>
          <div className="w-px h-12 bg-[#2d2d4e]" />
          <div>
            <div className="text-3xl font-black text-[#10b981]">60s</div>
            <div className="text-sm text-[#64748b]">Par manche</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#e2e8f0] mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-[#94a3b8] text-lg">
            4 phases, une seule règle : sois le plus créatif.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 text-center card-hover border border-[#2d2d4e] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-5xl mb-4">{step.icon}</div>
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <h3 className="font-bold text-[#e2e8f0]">{step.title}</h3>
              </div>
              <p className="text-sm text-[#94a3b8] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto glass rounded-3xl p-12 border border-[#2d2d4e]">
          <h2 className="text-3xl font-bold text-[#e2e8f0] mb-4">
            Prêt à montrer ton talent ?
          </h2>
          <p className="text-[#94a3b8] mb-8">
            Connecte-toi avec Discord et rejoins la bataille en quelques secondes.
          </p>
          {!loading && !isLoggedIn && (
            <button
              onClick={handleDiscordLogin}
              className="px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white text-lg font-bold rounded-xl transition-all duration-200 flex items-center gap-3 mx-auto"
            >
              <DiscordIcon size={24} />
              Se connecter avec Discord
            </button>
          )}
          {!loading && isLoggedIn && (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-lg font-bold rounded-xl transition-all duration-200"
            >
              Aller au Dashboard →
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#2d2d4e] py-8 px-6 text-center text-[#64748b] text-sm">
        <p>Prompt Battle Arena — Fait avec ❤️ et l&apos;IA</p>
      </footer>
    </main>
  );
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
