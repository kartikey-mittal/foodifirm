import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    neutral: 'bg-gray-50 text-gray-600 ring-1 ring-gray-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
