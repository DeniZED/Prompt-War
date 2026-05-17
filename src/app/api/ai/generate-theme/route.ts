import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTheme } from '@/lib/ai/themes';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const theme = await generateTheme();
    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Generate theme error:', error);
    return NextResponse.json({ error: 'Erreur de génération' }, { status: 500 });
  }
}
