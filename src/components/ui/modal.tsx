import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from './glass-card';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: ModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full ${sizes[size]} transform transition-all duration-300 animate-in fade-in zoom-in-95`}>
        <GlassCard className="relative overflow-hidden border border-slate-200/80 shadow-2xl bg-white/95" padded={false}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="font-body text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[75vh]">
            {children}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
