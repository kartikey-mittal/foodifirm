import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserType } from '@/types';

interface PublicRouteProps {
  children: React.ReactNode;
}

const userHomeMap: Record<UserType, string> = {
  admin: '/dashboard',
  restaurant: '/dashboard',
  customer: '/customer-portal',
  delivery_agent: '/login',
};

export function PublicRoute({ children }: PublicRouteProps) {
  const { currentUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <span className="text-xl font-bold text-white">F</span>
          </div>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
          </div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentUser && appUser) {
    const redirectPath = userHomeMap[appUser.userType] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
