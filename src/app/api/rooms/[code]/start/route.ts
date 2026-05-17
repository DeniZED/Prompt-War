import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateTheme } from '@/lib/ai/themes';

export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const code = params.code.toUpperCase();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json({ error: 'Configuration serveur manquante (SERVICE_ROLE_KEY)' }, { status: 500 });
    }

    const serviceClient = createServiceClient();

    const { data: room, error: roomError } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (roomError || !room) {
      console.error('Room fetch error:', roomError);
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
    }

    if (room.host_id !== user.id) {
      return NextResponse.json({ error: "Seul l'hôte peut démarrer" }, { status: 403 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Partie déjà en cours' }, { status: 400 });
    }

    const { data: players, error: playersError } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', room.id);

    if (playersError) {
      console.error('Players fetch error:', playersError);
      return NextResponse.json({ error: 'Erreur récupération joueurs' }, { status: 500 });
    }

    if (!players || players.length < 1) {
      return NextResponse.json({ error: 'Aucun joueur dans la salle' }, { status: 400 });
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
      console.error('Round insert error:', roundError);
      return NextResponse.json({ error: 'Erreur création du round: ' + roundError.message }, { status: 500 });
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
      console.error('Room update error:', updateError);
      return NextResponse.json({ error: 'Erreur démarrage: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({ round, theme });
  } catch (error) {
    console.error('Start game error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: 'Erreur serveur: ' + message }, { status: 500 });
  }
}
