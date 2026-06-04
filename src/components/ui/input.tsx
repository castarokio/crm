import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', containerClassName = '', type = 'text', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
        {label && (
          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all placeholder-slate-400 ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wide mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', containerClassName = '', rows = 3, ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
        {label && (
          <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all placeholder-slate-400 resize-none ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wide mt-0.5">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
