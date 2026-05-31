import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserType } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: UserType[];
}

const userHomeMap: Record<UserType, string> = {
  admin: '/dashboard',
  restaurant: '/dashboard',
  customer: '/login',
  delivery_agent: '/login',
};

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { currentUser, appUser, loading } = useAuth();
  const location = useLocation();

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
          <p className="text-sm text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !appUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(appUser.userType)) {
    const redirectPath = userHomeMap[appUser.userType] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
