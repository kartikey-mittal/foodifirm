import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthChange, logoutUser as firebaseLogout, sendPasswordReset } from '@/services/authService';
import { getUserProfile, createUserProfile, updateUserProfile } from '@/services/userService';
import { getBusinessByOwnerId, createBusiness } from '@/services/businessService';
import { getBusinessStats, createBusinessStats } from '@/services/statsService';
import { loginUser, registerUser } from '@/services/authService';
import type { User } from 'firebase/auth';
import type { AppUser, Business, BusinessStats, UserType } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  business: Business | null;
  businessStats: BusinessStats | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  userType: UserType;
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  city?: string;
  area?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessStats, setBusinessStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndBusiness = async (user: User) => {
    try {
      const profile = await getUserProfile(user.uid);
      setAppUser(profile);

      if (profile?.businessId) {
        const biz = await getBusinessByOwnerId(user.uid);
        if (biz) {
          setBusiness(biz);
          const stats = await getBusinessStats(biz.id);
          if (stats) setBusinessStats(stats);
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserAndBusiness(user);
      } else {
        setAppUser(null);
        setBusiness(null);
        setBusinessStats(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await loginUser(email, password);
    await fetchUserAndBusiness(cred.user);
    await updateUserProfile(cred.user.uid, { lastLoginAt: new Date().toISOString() });
  };

  const register = async (payload: RegisterPayload) => {
    const cred = await registerUser(payload.email, payload.password);
    const user = cred.user;

    const userData: Partial<AppUser> = {
      uid: user.uid,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      userType: payload.userType,
    };

    if (payload.userType === 'restaurant') {
      const { ref: businessRef, slug } = await createBusiness(user.uid, {
        businessName: payload.businessName || payload.fullName,
        businessPhone: payload.businessPhone || payload.phone,
        businessAddress: payload.businessAddress || '',
        city: payload.city || '',
        area: payload.area || '',
      });

      userData.businessId = businessRef.id;
      userData.businessSlug = slug;

      await createBusinessStats(businessRef.id);
    }

    await createUserProfile(user.uid, userData);

    const profile = await getUserProfile(user.uid);
    setAppUser(profile);

    if (profile?.businessId) {
      const biz = await getBusinessByOwnerId(user.uid);
      if (biz) {
        setBusiness(biz);
        const stats = await getBusinessStats(biz.id);
        if (stats) setBusinessStats(stats);
      }
    }
  };

  const logout = async () => {
    await firebaseLogout();
    setCurrentUser(null);
    setAppUser(null);
    setBusiness(null);
    setBusinessStats(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordReset(email);
  };

  const refreshBusiness = async () => {
    if (!appUser?.businessId) return;
    const biz = await getBusinessByOwnerId(currentUser!.uid);
    if (biz) setBusiness(biz);
  };

  const refreshStats = async () => {
    if (!business?.id) return;
    const stats = await getBusinessStats(business.id);
    if (stats) setBusinessStats(stats);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appUser,
        business,
        businessStats,
        loading,
        login,
        register,
        logout,
        resetPassword,
        refreshBusiness,
        refreshStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
