import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
    }

    const { data: players } = await supabase
      .from('room_players')
      .select('*, profile:profiles(*)')
      .eq('room_id', room.id)
      .order('joined_at', { ascending: true });

    return NextResponse.json({ room, players: players || [] });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
