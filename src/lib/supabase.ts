import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Use proxy to bypass ISP blocking (e.g. in Yemen). createClient requires an absolute URL.
const clientSupabaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/sb` : '/api/sb';

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    originalSupabaseUrl &&
    supabaseAnonKey &&
    originalSupabaseUrl !== '' &&
    supabaseAnonKey !== '' &&
    !originalSupabaseUrl.includes('placeholder')
  );
};

// Create Supabase client
export const supabase = createClient<Database>(
  clientSupabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key',
      },
    },
    // Disable Realtime — not needed and wastes connections
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
  }
);

// Helper to check if we're in demo mode (no Supabase configured)
export const isDemoMode = (): boolean => {
  return !isSupabaseConfigured();
};
