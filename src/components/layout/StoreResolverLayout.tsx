import { StoreProvider, useStore } from '@/context/StoreContext';
import { StoreNotFound } from './StoreNotFound';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

function StoreInner({ children }: { children: ReactNode }) {
  const { loading, error } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-500">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <StoreNotFound />;
  }

  return <>{children}</>;
}

export function StoreResolverLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <StoreInner>{children}</StoreInner>
    </StoreProvider>
  );
}
