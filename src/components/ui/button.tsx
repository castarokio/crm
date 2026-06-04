import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  loading = false,
  icon,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyle =
    'px-5 py-2.5 rounded-xl font-body text-xs font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-97 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 hover:shadow-lg',
    secondary: 'bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 hover:border-slate-350 shadow-sm',
    danger: 'bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 hover:border-rose-300 shadow-sm',
    success: 'bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-emerald-800 hover:border-emerald-350 shadow-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
