import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateRoomCode } from '@/lib/utils';
import type { CreateRoomRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body: CreateRoomRequest = await request.json();
    const { rounds_total = 3, max_players = 8 } = body;

    if (rounds_total < 1 || rounds_total > 5) {
      return NextResponse.json({ error: 'Nombre de manches invalide (1-5)' }, { status: 400 });
    }

    if (max_players < 2 || max_players > 8) {
      return NextResponse.json({ error: 'Nombre de joueurs invalide (2-8)' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Generate a unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await serviceClient
        .from('rooms')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    // Create the room
    const { data: room, error } = await serviceClient
      .from('rooms')
      .insert({
        code,
        host_id: user.id,
        status: 'waiting',
        rounds_total,
        max_players,
        current_round: 0,
        current_phase: 'lobby',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json({ error: 'Erreur lors de la création de la salle' }, { status: 500 });
    }

    // Add host as first player
    await serviceClient.from('room_players').insert({
      room_id: room.id,
      player_id: user.id,
      is_ready: false,
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
