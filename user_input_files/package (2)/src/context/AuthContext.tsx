import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check for saved session
      const savedUser = localStorage.getItem('fashionHubUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error loading user:', e);
        }
      }

      // If Supabase is configured, check for Supabase session
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch user profile from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const userData: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                phone: profile.phone || undefined,
                role: profile.role,
                avatar: profile.avatar || undefined,
                created_at: profile.created_at,
              };
              setUser(userData);
              localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            }
          }
        } catch (e) {
          console.error('Error fetching Supabase session:', e);
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
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
              const userData: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                phone: profile.phone || undefined,
                role: profile.role,
                avatar: profile.avatar || undefined,
                created_at: profile.created_at,
              };
              setUser(userData);
              localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            }
          } else {
            setUser(null);
            localStorage.removeItem('fashionHubUser');
          }
        }
      );

      return () => subscription.unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Try Supabase authentication first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Supabase login error:', error);
          setIsLoading(false);
          return false;
        }

        if (data.user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            const userData: User = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone || undefined,
              role: profile.role,
              avatar: profile.avatar || undefined,
              created_at: profile.created_at,
            };
            setUser(userData);
            localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            setIsLoading(false);
            return true;
          }
        }
      } catch (e) {
        console.error('Error during Supabase login:', e);
      }
    }

    // Fall back to demo login (for demo mode)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For demo, accept any email with password "demo123"
    let foundUser = mockUsers.find(u => u.email === email);

    if (!foundUser && password === 'demo123') {
      // Create demo customer user
      foundUser = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'customer' as UserRole,
        created_at: new Date().toISOString(),
      };
    }

    if (foundUser && password === 'demo123') {
      setUser(foundUser);
      localStorage.setItem('fashionHubUser', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    // Log out from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out from Supabase:', e);
      }
    }

    setUser(null);
    localStorage.removeItem('fashionHubUser');
  };

  const isAdmin = user?.role === 'admin';
  const isEditor = user?.role === 'editor' || isAdmin;
  const isViewer = user?.role === 'viewer' || isEditor || isAdmin;
  const canManageProducts = isAdmin || isEditor;
  const canManageOrders = isAdmin || isEditor;
  const canManageUsers = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        isAdmin,
        isEditor,
        isViewer,
        canManageProducts,
        canManageOrders,
        canManageUsers,
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
