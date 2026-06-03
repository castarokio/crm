import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getCallerSession } from '@/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getCallerSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  };

  const stream = new ReadableStream({
    start(controller) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        controller.enqueue('data: {"error": "DB_NOT_CONFIGURED"}\n\n');
        controller.close();
        return;
      }

      controller.enqueue('data: {"status": "connected"}\n\n');

      const channel = supabase
        .channel('server-leads-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads' },
          (payload: any) => {
            controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
          }
        )
        .subscribe();

      req.signal.addEventListener('abort', () => {
        supabase.removeChannel(channel);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers: responseHeaders });
}
