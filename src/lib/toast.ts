/**
 * Global Toast & Confirm System
 * Fire-and-forget toasts and async confirm dialogs via custom DOM events.
 * No prop drilling required — works from any component.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ConfirmEvent {
  id: string;
  title: string;
  message: string;
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const TOAST_EVENT_NAME = 'app:toast';
export const CONFIRM_EVENT_NAME = 'app:confirm';
export const CONFIRM_RESPONSE_PREFIX = 'app:confirm:response:';

let _idCounter = 0;
function uid() {
  return `${Date.now()}_${++_idCounter}`;
}

/** Show a toast notification */
function showToast(message: string, type: ToastType = 'info', duration = 3500) {
  if (typeof window === 'undefined') return;
  const detail: ToastEvent = { id: uid(), type, message, duration };
  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail }));
}

/** Show a styled confirm dialog and return a Promise<boolean> */
function showConfirm(
  message: string,
  options?: { title?: string; danger?: boolean; confirmLabel?: string; cancelLabel?: string }
): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  const id = uid();
  const detail: ConfirmEvent = {
    id,
    title: options?.title ?? 'Are you sure?',
    message,
    danger: options?.danger ?? false,
    confirmLabel: options?.confirmLabel ?? 'Confirm',
    cancelLabel: options?.cancelLabel ?? 'Cancel',
  };

  window.dispatchEvent(new CustomEvent(CONFIRM_EVENT_NAME, { detail }));

  return new Promise<boolean>((resolve) => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; result: boolean }>;
      if (ce.detail.id === id) {
        window.removeEventListener(CONFIRM_RESPONSE_PREFIX + id, handler);
        resolve(ce.detail.result);
      }
    };
    window.addEventListener(CONFIRM_RESPONSE_PREFIX + id, handler);
    // Safety timeout — auto-dismiss as false after 30s
    setTimeout(() => {
      window.removeEventListener(CONFIRM_RESPONSE_PREFIX + id, handler);
      resolve(false);
    }, 30_000);
  });
}

export const toast = {
  success: (msg: string, duration?: number) => showToast(msg, 'success', duration),
  error: (msg: string, duration?: number) => showToast(msg, 'error', duration ?? 5000),
  warning: (msg: string, duration?: number) => showToast(msg, 'warning', duration),
  info: (msg: string, duration?: number) => showToast(msg, 'info', duration),
};

export const confirm = showConfirm;
