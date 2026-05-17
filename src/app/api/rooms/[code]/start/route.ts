import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateTheme } from '@/lib/ai/themes';

export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const steps: string[] = [];

  try {
    steps.push('start');
    const supabase = createClient();
    steps.push('supabase_client');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    steps.push('got_user');

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié', steps }, { status: 401 });
    }

    const code = params.code.toUpperCase();
    steps.push('code_' + code);

    const serviceClient = createServiceClient();
    steps.push('service_client');

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    steps.push('room_fetched');

    if (roomError || !room) {
      return NextResponse.json({ error: 'Salle introuvable', steps, roomError: roomError?.message }, { status: 404 });
    }

    if (room.host_id !== user.id) {
      return NextResponse.json({ error: "Seul l'hôte peut démarrer", steps }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Partie déjà en cours: ' + room.status, steps }, { status: 400 });
    }

    steps.push('room_ok');

    const { data: players, error: playersError } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', room.id);

    steps.push('players_fetched_' + (players?.length ?? 'null'));

    if (playersError) {
      return NextResponse.json({ error: 'Erreur joueurs: ' + playersError.message, steps }, { status: 500 });
    }

    if (!players || players.length < 1) {
      return NextResponse.json({ error: 'Aucun joueur', steps }, { status: 400 });
    }

    steps.push('generating_theme');
    const theme = await generateTheme();
    steps.push('theme_ok');

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

    steps.push('round_insert');

    if (roundError) {
      return NextResponse.json({ error: 'Round error: ' + roundError.message, steps }, { status: 500 });
    }

    steps.push('round_ok');

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
      return NextResponse.json({ error: 'Update error: ' + updateError.message, steps }, { status: 500 });
    }

    return NextResponse.json({ round, theme, steps });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'CATCH: ' + message, steps }, { status: 500 });
  }
}
