import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { withTimeout } from '@/services/api';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Helper function to convert profile to User
const profileToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.name,
  phone: profile.phone || undefined,
  role: profile.role,
  avatar: profile.avatar || undefined,
  created_at: profile.created_at,
});

interface UserPermissions {
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_users: boolean;
  can_manage_ads: boolean;
  can_manage_cities: boolean;
  can_manage_currencies: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
}

const defaultPermissions: UserPermissions = {
  can_manage_products: false,
  can_manage_orders: false,
  can_manage_users: false,
  can_manage_ads: false,
  can_manage_cities: false,
  can_manage_currencies: false,
  can_view_reports: false,
  can_export_data: false,
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  permissions: UserPermissions;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canManageAds: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch permissions from database (not localStorage)
  const fetchPermissions = useCallback(async (userId: string, userRole: string) => {
    if (!isSupabaseConfigured()) return;

    // Admins always get full permissions — no need to check the DB
    if (userRole === 'admin') {
      setPermissions({
        can_manage_products: true,
        can_manage_orders: true,
        can_manage_users: true,
        can_manage_ads: true,
        can_manage_cities: true,
        can_manage_currencies: true,
        can_view_reports: true,
        can_export_data: true,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // No permissions row found — use restrictive defaults for non-admins
        setPermissions(defaultPermissions);
        return;
      }

      const d = data as any;
      setPermissions({
        can_manage_products: d.can_manage_products ?? false,
        can_manage_orders: d.can_manage_orders ?? false,
        can_manage_users: d.can_manage_users ?? false,
        can_manage_ads: d.can_manage_ads ?? false,
        can_manage_cities: d.can_manage_cities ?? false,
        can_manage_currencies: d.can_manage_currencies ?? false,
        can_view_reports: d.can_view_reports ?? false,
        can_export_data: d.can_export_data ?? false,
      });
    } catch (e) {
      console.error('Error fetching permissions:', e);
      // On error keep default restrictive permissions for safety
      setPermissions(defaultPermissions);
    }
  }, []);

  // Load user profile from database using session
  const loadProfileFromSession = useCallback(async (sessionUserId: string): Promise<User | null> => {
    try {
      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUserId)
        .single();

      if (profileFetchError && !profile) {
        // Profile missing — try to auto-create it from auth metadata
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: newProfile } = await (supabase as any)
            .from('profiles')
            .upsert({
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || (authUser.email || '').split('@')[0],
              phone: authUser.user_metadata?.phone || null,
              role: authUser.app_metadata?.role || authUser.user_metadata?.role || 'customer',
            }, { onConflict: 'id' })
            .select()
            .single();

          if (newProfile) {
            const userData = profileToUser(newProfile);
            localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            await fetchPermissions(userData.id, userData.role);
            return userData;
          }
        }
        return null;
      }

      if (profile) {
        const userData = profileToUser(profile);
        localStorage.setItem('fashionHubUser', JSON.stringify(userData));
        await fetchPermissions(userData.id, userData.role);
        return userData;
      }
    } catch (e) {
      console.error('❌ Error loading profile:', e);
    }
    return null;
  }, [fetchPermissions]);

  useEffect(() => {
    const initAuth = async () => {
      // Safety timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      try {
        if (isSupabaseConfigured()) {
          // ALWAYS check Supabase session first (source of truth)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const userData = await loadProfileFromSession(session.user.id);
            if (userData) {
              setUser(userData);
            }
          } else {
            // No active session - clear any stale localStorage
            localStorage.removeItem('fashionHubUser');
            setUser(null);
          }
        } else {
          // Supabase not configured - show cached user for display only
          const savedUser = localStorage.getItem('fashionHubUser');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              localStorage.removeItem('fashionHubUser');
            }
          }
        }
      } catch (globalError) {
        console.error('Auth initialization error:', globalError);
        // On error, try localStorage as fallback for display
        const savedUser = localStorage.getItem('fashionHubUser');
        if (savedUser) {
          try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const userData = await loadProfileFromSession(session.user.id);
            if (userData) setUser(userData);
          } else {
            setUser(null);
            setPermissions(defaultPermissions);
            localStorage.removeItem('fashionHubUser');
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, [loadProfileFromSession, fetchPermissions]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return { success: false, error: 'قاعدة البيانات غير متصلة' };
    }

    try {
      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      }), 30000);

      if (error) {
        setIsLoading(false);
        if (error.message.includes('confirmed')) return { success: false, error: 'email_not_confirmed' };
        return { success: false, error: `auth_error:${error.message}` };
      }

      if (data.user) {
        // Try fetching profile
        let { data: profile } = await withTimeout(
          Promise.resolve(supabase.from('profiles').select('*').eq('id', data.user.id).single()),
          15000
        );

        if (!profile) {
          // Profile missing — upsert it now
          const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role || 'customer';
          try {
            const { data: newProfile } = await withTimeout(
              (supabase as any).from('profiles').upsert({
                id: data.user.id,
                email: email.trim().toLowerCase(),
                name: data.user.user_metadata?.name || email.split('@')[0],
                role: metaRole,
              }, { onConflict: 'id' }).select().single(),
              15000
            );
            profile = newProfile;
          } catch (e) {
            console.error('Profile upsert timeout/error', e);
          }
        }

        if (profile) {
          const userData = profileToUser(profile);
          setUser(userData);
          localStorage.setItem('fashionHubUser', JSON.stringify(userData));
          await fetchPermissions(userData.id, userData.role);
          setIsLoading(false);
          return { success: true };
        }
      }
    } catch (e: any) {
      console.error('Login error:', e);
      setIsLoading(false);
      return { success: false, error: e?.message?.includes('Timeout') ? 'timeout' : `unknown:${e?.message}` };
    }

    setIsLoading(false);
    return { success: false, error: 'unknown' };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setPermissions(defaultPermissions);
    localStorage.removeItem('fashionHubUser');
    // Navigate to home
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('fashionHubUser', JSON.stringify(updated));
      return updated;
    });
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isEditor = user?.role?.toLowerCase() === 'editor' || isAdmin;
  const isViewer = user?.role?.toLowerCase() === 'viewer' || isEditor || isAdmin;
  
  const canManageProducts = isAdmin || permissions.can_manage_products;
  const canManageOrders = isAdmin || permissions.can_manage_orders;
  const canManageUsers = isAdmin || permissions.can_manage_users;
  const canManageAds = isAdmin || permissions.can_manage_ads;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        isAdmin,
        isEditor,
        isViewer,
        permissions,
        canManageProducts,
        canManageOrders,
        canManageUsers,
        canManageAds
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
