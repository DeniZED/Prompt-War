import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { round_id, prompt_id } = await request.json();

    if (!round_id || !prompt_id) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify the prompt exists and doesn't belong to the voter
    const { data: prompt } = await serviceClient
      .from('prompts')
      .select('id, player_id, round_id')
      .eq('id', prompt_id)
      .eq('round_id', round_id)
      .single();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt introuvable' }, { status: 404 });
    }

    if (prompt.player_id === user.id) {
      return NextResponse.json({ error: 'Tu ne peux pas voter pour ton propre prompt' }, { status: 400 });
    }

    // Check not already voted in this round
    const { data: existing } = await serviceClient
      .from('votes')
      .select('id')
      .eq('round_id', round_id)
      .eq('voter_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Tu as déjà voté ce round' }, { status: 400 });
    }

    const { data: vote, error: voteError } = await serviceClient
      .from('votes')
      .insert({
        round_id,
        voter_id: user.id,
        prompt_id,
      })
      .select()
      .single();

    if (voteError) {
      return NextResponse.json({ error: 'Impossible de voter' }, { status: 500 });
    }

    return NextResponse.json({ vote });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
