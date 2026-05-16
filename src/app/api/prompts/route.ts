import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { moderatePrompt } from '@/lib/ai/moderation';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { round_id, content } = await request.json();

    if (!round_id || !content?.trim()) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    if (content.trim().length > 200) {
      return NextResponse.json({ error: 'Prompt trop long (max 200 caractères)' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify round exists and is in prompting phase
    const { data: round } = await serviceClient
      .from('rounds')
      .select('id, room_id, finished_at')
      .eq('id', round_id)
      .single();

    if (!round || round.finished_at) {
      return NextResponse.json({ error: 'Round invalide ou terminé' }, { status: 400 });
    }

    // Check player is in the room
    const { data: player } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', round.room_id)
      .eq('player_id', user.id)
      .single();

    if (!player) {
      return NextResponse.json({ error: 'Tu n\'es pas dans cette salle' }, { status: 403 });
    }

    // Check not already submitted
    const { data: existing } = await serviceClient
      .from('prompts')
      .select('id')
      .eq('round_id', round_id)
      .eq('player_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Tu as déjà soumis un prompt' }, { status: 400 });
    }

    // Moderate prompt
    const moderationResult = await moderatePrompt(content.trim());
    const isModerated = moderationResult === 'unsafe';

    const { data: prompt, error: insertError } = await serviceClient
      .from('prompts')
      .insert({
        round_id,
        player_id: user.id,
        content: content.trim(),
        is_moderated: isModerated,
        is_generating: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Impossible de soumettre' }, { status: 500 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Submit prompt error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
