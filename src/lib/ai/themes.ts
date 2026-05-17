import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateTheme(): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Génère un thème créatif et amusant pour un jeu de bataille de prompts IA. Le thème doit être imaginatif et ouvert à l'interprétation créative.

Exemples de bons thèmes:
- "Crée le boss final d'un chantier de construction"
- "Imagine un super-héros dont le pouvoir est lié à la cuisine"
- "Conçois un véhicule futuriste pour les villes sous-marines"
- "Représente une alliance improbable entre un chat et un robot"
- "Imagine le café du matin dans 200 ans"

Retourne UNIQUEMENT le texte du thème en français, 1-2 phrases maximum, sans guillemets ni ponctuation finale.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text.trim();
}
