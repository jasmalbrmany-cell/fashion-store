import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { usersService } from '@/services';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileData = ProfileRow | null | undefined;

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

  const fetchPermissions = async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If table doesn't exist or no permissions found, use defaults
        console.warn('Permissions fetch error (using defaults):', error.message);
        setPermissions(defaultPermissions);
        return;
      }
      
      if (data) {
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
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (e) {
      console.error('Error fetching permissions:', e);
      setPermissions(defaultPermissions);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      try {
        const savedUser = localStorage.getItem('fashionHubUser');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            if (parsed.role !== 'customer') fetchPermissions(parsed.id);
          } catch (e) {
            console.error('Failed to parse saved user:', e);
            localStorage.removeItem('fashionHubUser');
          }
        }

        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const userData = profileToUser(profile);
              setUser(userData);
              localStorage.setItem('fashionHubUser', JSON.stringify(userData));
              if (userData.role !== 'customer') await fetchPermissions(userData.id);
            }
          }
        }
      } catch (globalError) {
        console.error('Auth error:', globalError);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const userData = profileToUser(profile);
              setUser(userData);
              localStorage.setItem('fashionHubUser', JSON.stringify(userData));
              if (userData.role !== 'customer') fetchPermissions(userData.id);
            }
          } else {
            setUser(null);
            setPermissions(defaultPermissions);
            localStorage.removeItem('fashionHubUser');
          }
        }
      );
      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          setIsLoading(false);
          if (error.message.includes('confirmed')) return { success: false, error: 'email_not_confirmed' };
          return { success: false, error: 'invalid_credentials' };
        }

        if (data.user) {
          let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();

          if (!profile) {
            const metaRole = data.user.app_metadata?.role || data.user.user_metadata?.role || 'customer';
            const { data: newProfile } = await (supabase as any).from('profiles').upsert({
              id: data.user.id, email, name: data.user.user_metadata?.name || email.split('@')[0], role: metaRole
            }).select().single();
            profile = newProfile;
          }

          if (profile) {
            const userData = profileToUser(profile);
            setUser(userData);
            localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            if (userData.role !== 'customer') await fetchPermissions(userData.id);
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (e) {
        setIsLoading(false);
        return { success: false, error: 'unknown' };
      }
    }

    // Demo Mode logic remains but should fetch permissions if existing in storage
    const allUsers = await usersService.getAll();
    const foundUser = allUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    if (foundUser && (password === 'demo123' || foundUser.id.startsWith('user-'))) {
      setUser(foundUser);
      localStorage.setItem('fashionHubUser', JSON.stringify(foundUser));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: 'invalid_credentials' };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setPermissions(defaultPermissions);
    localStorage.removeItem('fashionHubUser');
    // Force navigation to home without reload
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
  
  // Real granular permissions
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
