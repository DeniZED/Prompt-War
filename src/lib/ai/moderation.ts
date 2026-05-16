import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ModerationResult = 'safe' | 'unsafe';

export async function moderatePrompt(prompt: string): Promise<ModerationResult> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `Analyse ce prompt pour génération d'image et détermine s'il est approprié pour un jeu familial.

Prompt: "${prompt}"

Réponds UNIQUEMENT par "safe" ou "unsafe".
- "unsafe" si le prompt contient: violence explicite, contenu sexuel, discours haineux, contenu illégal, ou toute représentation de personnes réelles dans des contextes inappropriés.
- "safe" pour tout autre contenu créatif, même fantaisiste ou étrange.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return 'safe';

    const result = content.text.trim().toLowerCase();
    return result === 'unsafe' ? 'unsafe' : 'safe';
  } catch (error) {
    console.error('Moderation error:', error);
    // Default to safe if moderation fails to avoid blocking gameplay
    return 'safe';
  }
}
