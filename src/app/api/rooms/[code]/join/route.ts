import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'La partie a déjà commencé' }, { status: 400 });
    }

    const { data: players } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', room.id);

    if (players && players.length >= room.max_players) {
      return NextResponse.json({ error: 'La salle est complète' }, { status: 400 });
    }

    const { data: existing } = await serviceClient
      .from('room_players')
      .select('id')
      .eq('room_id', room.id)
      .eq('player_id', user.id)
      .single();

    if (!existing) {
      const { data: player, error: joinError } = await serviceClient
        .from('room_players')
        .insert({ room_id: room.id, player_id: user.id, is_ready: false })
        .select()
        .single();

      if (joinError) {
        return NextResponse.json({ error: 'Impossible de rejoindre' }, { status: 500 });
      }

      return NextResponse.json({ room, player });
    }

    return NextResponse.json({ room, player: existing });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
