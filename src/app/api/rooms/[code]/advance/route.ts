import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateTheme } from '@/lib/ai/themes';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const code = params.code.toUpperCase();
    const { next_phase } = await request.json();
    const serviceClient = createServiceClient();

    const { data: room } = await serviceClient
      .from('rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (!room) {
      return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
    }

    if (room.host_id !== user.id) {
      return NextResponse.json({ error: 'Seul l\'hôte peut avancer' }, { status: 403 });
    }

    let updateData: Record<string, unknown> = {};

    if (next_phase === 'generating') {
      updateData = { current_phase: 'generating', phase_ends_at: null };

      // Trigger image generation for all prompts that don't have an image
      const { data: round } = await serviceClient
        .from('rounds')
        .select('id')
        .eq('room_id', room.id)
        .eq('round_number', room.current_round)
        .single();

      if (round) {
        const { data: prompts } = await serviceClient
          .from('prompts')
          .select('*')
          .eq('round_id', round.id)
          .is('image_url', null)
          .eq('is_moderated', false);

        if (prompts && prompts.length > 0) {
          // Mark as generating
          await serviceClient
            .from('prompts')
            .update({ is_generating: true })
            .in('id', prompts.map((p) => p.id));

          // Fire-and-forget image generation
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          prompts.forEach((prompt) => {
            fetch(`${appUrl}/api/ai/generate-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt_id: prompt.id, prompt: prompt.content }),
            }).catch(console.error);
          });
        }
      }
    } else if (next_phase === 'voting') {
      updateData = {
        current_phase: 'voting',
        phase_ends_at: new Date(Date.now() + 30_000).toISOString(),
      };
    } else if (next_phase === 'results') {
      // Calculate scores for the round
      const { data: round } = await serviceClient
        .from('rounds')
        .select('id')
        .eq('room_id', room.id)
        .eq('round_number', room.current_round)
        .single();

      if (round) {
        const { data: prompts } = await serviceClient
          .from('prompts')
          .select('id, player_id')
          .eq('round_id', round.id);

        const { data: votes } = await serviceClient
          .from('votes')
          .select('prompt_id')
          .eq('round_id', round.id);

        if (prompts && votes) {
          const votesByPrompt: Record<string, number> = {};
          votes.forEach((v) => {
            votesByPrompt[v.prompt_id] = (votesByPrompt[v.prompt_id] || 0) + 1;
          });

          const maxVotes = Math.max(0, ...Object.values(votesByPrompt));

          for (const prompt of prompts) {
            const votesReceived = votesByPrompt[prompt.id] || 0;
            const isWinner = votesReceived > 0 && votesReceived === maxVotes;
            const xpEarned = votesReceived * 10 + (isWinner ? 50 : 0);

            await serviceClient.from('round_scores').upsert({
              round_id: round.id,
              player_id: prompt.player_id,
              votes_received: votesReceived,
              xp_earned: xpEarned,
            });

            if (xpEarned > 0) {
              await serviceClient.rpc('increment_xp', {
                user_id: prompt.player_id,
                xp_amount: xpEarned,
              });
            }
          }
        }

        await serviceClient
          .from('rounds')
          .update({ finished_at: new Date().toISOString() })
          .eq('id', round.id);
      }

      updateData = { current_phase: 'results', phase_ends_at: null };
    } else if (next_phase === 'next_round') {
      const nextRoundNumber = room.current_round + 1;

      if (nextRoundNumber > room.rounds_total) {
        await serviceClient
          .from('profiles')
          .update({ games_played: serviceClient.rpc('increment', { x: 1 }) })
          .eq('id', room.host_id);

        updateData = {
          current_phase: 'finished',
          status: 'finished',
          phase_ends_at: null,
        };
      } else {
        const theme = await generateTheme();
        const phaseEndsAt = new Date(Date.now() + 60_000).toISOString();

        await serviceClient.from('rounds').insert({
          room_id: room.id,
          round_number: nextRoundNumber,
          theme,
          started_at: new Date().toISOString(),
        });

        updateData = {
          current_round: nextRoundNumber,
          current_phase: 'prompting',
          phase_ends_at: phaseEndsAt,
        };
      }
    }

    await serviceClient.from('rooms').update(updateData).eq('id', room.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Advance phase error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
