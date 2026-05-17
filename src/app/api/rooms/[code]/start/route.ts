import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateTheme } from '@/lib/ai/themes';

export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const code = params.code.toUpperCase();
    const serviceClient = createServiceClient();

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
    }

    if (room.host_id !== user.id) {
      return NextResponse.json({ error: 'Seul l\'hôte peut démarrer' }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Partie déjà en cours' }, { status: 400 });
    }

    const { data: players } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', room.id);

    if (!players || players.length < 2) {
      return NextResponse.json({ error: 'Il faut au moins 2 joueurs' }, { status: 400 });
    }

    const theme = await generateTheme();
    const phaseEndsAt = new Date(Date.now() + 60_000).toISOString();

    const { data: round, error: roundError } = await serviceClient
      .from('rounds')
      .insert({
        room_id: room.id,
        round_number: 1,
        theme,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (roundError) {
      return NextResponse.json({ error: 'Erreur création du round' }, { status: 500 });
    }

    const { error: updateError } = await serviceClient
      .from('rooms')
      .update({
        status: 'playing',
        current_round: 1,
        current_phase: 'prompting',
        phase_ends_at: phaseEndsAt,
      })
      .eq('id', room.id);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur démarrage' }, { status: 500 });
    }

    return NextResponse.json({ round, theme });
  } catch (error) {
    console.error('Start game error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
