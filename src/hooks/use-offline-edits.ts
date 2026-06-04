import { useEffect, useState, useCallback } from 'react';
import { updateCallStatus } from '@/app/actions/leads';

export type BufferedAction = {
  id: string;
  leadId: number;
  status: string;
  notes: string;
  callNotes: string;
  callerName: string;
  meetingDate?: string;
  timestamp: number;
};

const OUTBOX_KEY = '__callos_outbox';

export function useOfflineEdits(onSyncStart?: () => void, onSyncEnd?: (successCount: number) => void) {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [outboxSize, setOutboxSize] = useState<number>(0);

  // Sync outbox queue
  const syncOutbox = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const rawOutbox = localStorage.getItem(OUTBOX_KEY);
    if (!rawOutbox) return;

    const outbox: BufferedAction[] = JSON.parse(rawOutbox);
    if (outbox.length === 0) return;

    if (onSyncStart) onSyncStart();

    let successCount = 0;
    const remaining: BufferedAction[] = [];

    for (const action of outbox) {
      try {
        const res = await updateCallStatus(
          action.leadId,
          action.status,
          action.notes,
          action.callNotes,
          action.callerName,
          action.meetingDate
        );
        if (res.success) {
          successCount++;
        } else {
          // If collision or lock out, we hold the action or skip depending on business logic
          console.warn(`[Offline Sync Collision Warning] Lead #${action.leadId} skipped: ${res.error}`);
          // Keep it to retry or resolve conflict
          remaining.push(action);
        }
      } catch (err) {
        console.error('[Offline Sync Error]', err);
        remaining.push(action);
      }
    }

    localStorage.setItem(OUTBOX_KEY, JSON.stringify(remaining));
    setOutboxSize(remaining.length);

    if (onSyncEnd) onSyncEnd(successCount);
  }, [onSyncStart, onSyncEnd]);

  // Listen to browser network changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOffline(!window.navigator.onLine);
    setOutboxSize(JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]').length);

    const handleOnline = () => {
      setIsOffline(false);
      void syncOutbox();
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOutbox]);

  const queueEdit = useCallback((
    leadId: number,
    status: string,
    notes: string,
    callNotes: string,
    callerName: string,
    meetingDate?: string
  ) => {
    if (typeof window === 'undefined') return false;

    const action: BufferedAction = {
      id: Math.random().toString(36).substring(2, 15),
      leadId,
      status,
      notes,
      callNotes,
      callerName,
      meetingDate,
      timestamp: Date.now(),
    };

    const rawOutbox = localStorage.getItem(OUTBOX_KEY) || '[]';
    const outbox: BufferedAction[] = JSON.parse(rawOutbox);
    outbox.push(action);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    setOutboxSize(outbox.length);
    return true;
  }, []);

  return {
    isOffline,
    outboxSize,
    queueEdit,
    syncOutbox,
  };
}
