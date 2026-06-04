import { useEffect } from 'react';

type SSEEvent = {
  leadId: number;
  status?: string;
  user: string;
};

type RealtimeSyncProps = {
  onLockAcquired?: (leadId: number, user: string) => void;
  onLockReleased?: (leadId: number, user: string) => void;
  onStatusChanged?: (leadId: number, status: string, user: string) => void;
};

export function useRealtimeSync({
  onLockAcquired,
  onLockReleased,
  onStatusChanged,
}: RealtimeSyncProps) {
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime');

    eventSource.addEventListener('LOCK_ACQUIRED', (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        if (onLockAcquired) {
          onLockAcquired(data.leadId, data.user);
        }
      } catch (err) {
        console.error('[SSE parse error - LOCK_ACQUIRED]', err);
      }
    });

    eventSource.addEventListener('LOCK_RELEASED', (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        if (onLockReleased) {
          onLockReleased(data.leadId, data.user);
        }
      } catch (err) {
        console.error('[SSE parse error - LOCK_RELEASED]', err);
      }
    });

    eventSource.addEventListener('STATUS_CHANGED', (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        if (onStatusChanged && data.status) {
          onStatusChanged(data.leadId, data.status, data.user);
        }
      } catch (err) {
        console.error('[SSE parse error - STATUS_CHANGED]', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('[SSE Connection Warning] EventSource encountered an error, reconnecting...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [onLockAcquired, onLockReleased, onStatusChanged]);
}
