import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageContainer({ title, description, children, actions, className }: PageContainerProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
