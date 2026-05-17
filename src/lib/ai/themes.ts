import Anthropic from '@anthropic-ai/sdk';

const FALLBACK_THEMES = [
  "Crée le boss final d'un chantier de construction abandonné depuis 100 ans",
  'Imagine un super-héros dont le pouvoir est lié à la cuisine de rue',
  'Conçois un véhicule futuriste pour les villes sous-marines',
  'Représente une alliance improbable entre un chat et un robot de combat',
  "Imagine le café du matin dans 200 ans sur une station spatiale",
  "Dessine le château d'un roi des pigeons de ville",
  "Crée un dragon qui a peur du feu et s'est reconverti en pâtissier",
  'Imagine une forêt où les arbres sont des gratte-ciels vivants',
  "Conçois l'armure ultime fabriquée entièrement en fromage",
  'Représente une guerre épique entre des flamants roses et des cactus',
];

export async function generateTheme(): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return FALLBACK_THEMES[Math.floor(Math.random() * FALLBACK_THEMES.length)];
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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
  } catch {
    return FALLBACK_THEMES[Math.floor(Math.random() * FALLBACK_THEMES.length)];
  }
}
