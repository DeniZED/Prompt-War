import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prompt Battle Arena',
  description: "Le jeu où l'IA génère et tu domines. Écris le meilleur prompt, génère des images épiques, vote pour les meilleures.",
  keywords: ['prompt', 'battle', 'arena', 'IA', 'image', 'jeu', 'gaming'],
  openGraph: {
    title: 'Prompt Battle Arena',
    description: "L'IA génère, tu domines.",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
