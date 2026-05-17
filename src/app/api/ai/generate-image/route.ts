import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createServiceClient } from '@/lib/supabase/server';

fal.config({ credentials: process.env.FAL_KEY });

interface FalImageResult {
  images?: { url: string }[];
}

export async function POST(request: Request) {
  let promptId: string | null = null;

  try {
    const body = await request.json();
    const { prompt_id, prompt } = body;
    promptId = prompt_id;

    if (!prompt_id || !prompt) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: existingPrompt } = await serviceClient
      .from('prompts')
      .select('id, image_url, is_moderated')
      .eq('id', prompt_id)
      .single();

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt introuvable' }, { status: 404 });
    }

    if (existingPrompt.is_moderated) {
      return NextResponse.json({ error: 'Prompt modéré' }, { status: 400 });
    }

    if (existingPrompt.image_url) {
      return NextResponse.json({ image_url: existingPrompt.image_url });
    }

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: `${prompt}. High quality digital art, detailed, vibrant colors.`,
        image_size: 'square_hd',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const imageUrl = (result.data as FalImageResult)?.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image returned from fal.ai');
    }

    await serviceClient
      .from('prompts')
      .update({ image_url: imageUrl, is_generating: false })
      .eq('id', prompt_id);

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Generate image error:', error);

    if (promptId) {
      try {
        const serviceClient = createServiceClient();
        await serviceClient
          .from('prompts')
          .update({ is_generating: false })
          .eq('id', promptId);
      } catch {}
    }

    return NextResponse.json({ error: "Erreur de génération d'image" }, { status: 500 });
  }
}
