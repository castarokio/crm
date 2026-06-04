import { NextRequest } from 'next/server';
import { addSseClient, removeSseClient } from '@/lib/sse-broker';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const clientId = Math.random().toString(36).substring(2, 15);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Enqueue keep-alive comment immediately to open connection
      controller.enqueue(encoder.encode(': ok\n\n'));

      // Keep connection alive every 20 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          // Stream might have closed, handled in abort listener
        }
      }, 20000);

      // Register client to global broker
      addSseClient({
        id: clientId,
        enqueue: (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // Already closed, ignore
          }
        },
      });

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        removeSseClient(clientId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
