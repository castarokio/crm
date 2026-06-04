'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import {
  TOAST_EVENT_NAME,
  CONFIRM_EVENT_NAME,
  CONFIRM_RESPONSE_PREFIX,
  type ToastEvent,
  type ConfirmEvent,
} from '@/lib/toast';

/* ─────────────────────────── TOAST STACK ─────────────────────────── */

const TOAST_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />,
  error:   <XCircle     className="w-4 h-4 shrink-0 text-rose-500" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />,
  info:    <Info        className="w-4 h-4 shrink-0 text-indigo-500" />,
};

const TOAST_STYLES: Record<string, string> = {
  success: 'bg-white border-l-4 border-emerald-500 shadow-emerald-100',
  error:   'bg-white border-l-4 border-rose-500 shadow-rose-100',
  warning: 'bg-white border-l-4 border-amber-400 shadow-amber-100',
  info:    'bg-white border-l-4 border-indigo-500 shadow-indigo-100',
};

interface ActiveToast extends ToastEvent {
  visible: boolean;
}

function ToastItem({ toast, onRemove }: { toast: ActiveToast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border border-slate-100 min-w-[280px] max-w-[380px] font-body text-sm transition-all duration-300 ${
        TOAST_STYLES[toast.type]
      } ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
    >
      {TOAST_ICONS[toast.type]}
      <span className="flex-1 text-slate-700 font-semibold text-xs leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors ml-1 mt-0.5 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────────── CONFIRM MODAL ─────────────────────────── */

interface ActiveConfirm extends ConfirmEvent {
  visible: boolean;
}

function ConfirmModal({ data, onResolve }: { data: ActiveConfirm; onResolve: (id: string, result: boolean) => void }) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-200 ${
        data.visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => onResolve(data.id, false)}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-5 border border-slate-100 z-10">
        {/* Icon + Title row */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${data.danger ? 'bg-rose-50' : 'bg-amber-50'}`}>
            <AlertCircle className={`w-5 h-5 ${data.danger ? 'text-rose-500' : 'text-amber-500'}`} />
          </div>
          <h2 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-wide">
            {data.title}
          </h2>
        </div>

        {/* Message */}
        <p className="font-body text-xs text-slate-600 leading-relaxed">
          {data.message}
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => onResolve(data.id, false)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-body font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
          >
            {data.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={() => onResolve(data.id, true)}
            className={`px-4 py-2 rounded-xl font-body font-bold text-xs uppercase tracking-wider cursor-pointer transition-all text-white shadow-sm ${
              data.danger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {data.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN PROVIDER ─────────────────────────── */

export function AppDialogs() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [confirmQueue, setConfirmQueue] = useState<ActiveConfirm[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const resolveConfirm = useCallback((id: string, result: boolean) => {
    // Animate out
    setConfirmQueue(prev => prev.map(c => c.id === id ? { ...c, visible: false } : c));
    // Dispatch response event
    window.dispatchEvent(
      new CustomEvent(CONFIRM_RESPONSE_PREFIX + id, { detail: { id, result } })
    );
    // Remove after animation
    setTimeout(() => setConfirmQueue(prev => prev.filter(c => c.id !== id)), 250);
  }, []);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      const newToast: ActiveToast = { ...detail, visible: false };
      setToasts(prev => [...prev, newToast]);
      // Trigger visibility on next tick for animation
      requestAnimationFrame(() => {
        setToasts(prev => prev.map(t => t.id === newToast.id ? { ...t, visible: true } : t));
      });
    };

    const handleConfirm = (e: Event) => {
      const detail = (e as CustomEvent<ConfirmEvent>).detail;
      const newConfirm: ActiveConfirm = { ...detail, visible: false };
      setConfirmQueue(prev => [...prev, newConfirm]);
      requestAnimationFrame(() => {
        setConfirmQueue(prev => prev.map(c => c.id === newConfirm.id ? { ...c, visible: true } : c));
      });
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);
    window.addEventListener(CONFIRM_EVENT_NAME, handleConfirm);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);
      window.removeEventListener(CONFIRM_EVENT_NAME, handleConfirm);
    };
  }, []);

  return (
    <>
      {/* ── Toast Stack (bottom-right) ── */}
      <div className="fixed bottom-5 right-5 z-[150] flex flex-col gap-2.5 items-end pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>

      {/* ── Confirm Modal (top of stack) ── */}
      {confirmQueue.map(c => (
        <ConfirmModal key={c.id} data={c} onResolve={resolveConfirm} />
      ))}
    </>
  );
}
