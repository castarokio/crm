import React from 'react';

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  padded?: boolean;
};

export function GlassCard({
  children,
  className = '',
  hoverable = false,
  padded = true,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-panel rounded-2xl ${padded ? 'p-6' : ''} ${
        hoverable ? 'glass-card-hover' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
