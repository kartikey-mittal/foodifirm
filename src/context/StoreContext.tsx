import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getBusinessById, getBusinessBySlug } from '@/services/businessService';
import type { Business } from '@/types';

interface StoreContextType {
  storeId: string;
  business: Business | null;
  businessId: string | null;
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { storeId } = useParams<{ storeId: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setError('No store specified');
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try as document ID first, then fallback to slug
        let biz = await getBusinessById(storeId);
        if (!biz) {
          biz = await getBusinessBySlug(storeId);
        }
        if (biz) {
          setBusiness(biz);
        } else {
          setError('Store not found');
          setBusiness(null);
        }
      } catch (err) {
        setError('Failed to load store');
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [storeId]);

  return (
    <StoreContext.Provider
      value={{
        storeId: storeId || '',
        business,
        businessId: business?.id || null,
        loading,
        error,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
