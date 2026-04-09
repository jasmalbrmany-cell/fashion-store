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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
      // Safety timeout to prevent infinite loading state
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        console.warn('Auth initialization timed out after 8s');
      }, 8000);

      try {
        // Check for saved session
        const savedUser = localStorage.getItem('fashionHubUser');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            console.error('Error loading user from localStorage:', e);
          }
        }

        // If Supabase is configured, check for Supabase session
        if (isSupabaseConfigured()) {
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('Supabase getSession error:', sessionError);
            }

            if (session?.user) {
              // Fetch user profile from database
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                console.error('Error fetching Supabase profile:', profileError);
              }

              if (profile) {
                const userData = profileToUser(profile);
                setUser(userData);
                localStorage.setItem('fashionHubUser', JSON.stringify(userData));
              }
            }
          } catch (e) {
            console.error('Error in Supabase initialization:', e);
          }
        }
      } catch (globalError) {
        console.error('Global error in initAuth:', globalError);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
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
              const userData = profileToUser(profile);
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Try Supabase authentication first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          console.error('Supabase login error:', error);
          setIsLoading(false);
          // Return specific error messages
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            return { success: false, error: 'email_not_confirmed' };
          }
          if (error.message.includes('Invalid login credentials')) {
            return { success: false, error: 'invalid_credentials' };
          }
          return { success: false, error: error.message };
        }

        if (data.user) {
          // Fetch user profile
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // If no profile, create one with role from metadata
          if (!profile) {
            const metaRole =
              data.user.app_metadata?.role ||
              data.user.user_metadata?.role ||
              'customer';
            const { data: newProfile } = await (supabase as any)
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email || email,
                name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || email.split('@')[0],
                role: metaRole,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();
            profile = newProfile;
          }

          // If profile exists but role might need update from metadata
          if (profile && (profile as any).role === 'customer') {
            const metaRole =
              data.user.app_metadata?.role ||
              data.user.user_metadata?.role;
            if (metaRole && metaRole !== 'customer') {
              const { data: updatedProfile } = await (supabase as any)
                .from('profiles')
                .update({ role: metaRole })
                .eq('id', data.user.id)
                .select()
                .single();
              if (updatedProfile) profile = updatedProfile;
            }
          }

          if (profile) {
            const userData = profileToUser(profile);
            setUser(userData);
            localStorage.setItem('fashionHubUser', JSON.stringify(userData));
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (e) {
        console.error('Error during Supabase login:', e);
        setIsLoading(false);
        return { success: false, error: 'unknown' };
      }
    }

    // Fallback demo login
    await new Promise(resolve => setTimeout(resolve, 500));
    const allUsers = await usersService.getAll();
    const foundUser = allUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    // We allow any password for newly created demo users to make testing easier
    // or keep demo123 for initial mock users.
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
