import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, boolean | string> = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    FAL_KEY: !!process.env.FAL_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
  };

  const missing = Object.entries(checks)
    .filter(([, v]) => v === false)
    .map(([k]) => k);

  let dbStatus = 'not tested';
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createServiceClient } = await import('@/lib/supabase/server');
      const client = createServiceClient();
      const { error } = await client.from('rooms').select('id').limit(1);
      dbStatus = error ? `error: ${error.message}` : 'ok';
    } catch (e) {
      dbStatus = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({
    env: checks,
    missing,
    db: dbStatus,
    ok: missing.length === 0,
  });
}
