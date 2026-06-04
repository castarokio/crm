import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getCallerSession } from '@/lib/auth-session';
import { broadcastSse } from '@/lib/sse-broker';

export async function POST(req: NextRequest) {
  try {
    const session = await getCallerSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const body = await req.json();
    const { leadId } = body;
    if (!leadId) return NextResponse.json({ error: 'LEAD_ID_REQUIRED' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'DB_NOT_CONFIGURED' }, { status: 500 });

    const { error } = await supabase
      .from('leads')
      .update({
        assigned_to: null,
        last_updated: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('assigned_to', session.name);

    if (error) throw new Error(error.message);

    // Broadcast SSE unlock event to all callers
    broadcastSse('LOCK_RELEASED', { leadId, user: session.name });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[unlock-lead API Error]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
