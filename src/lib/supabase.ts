import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// In production, route through our own Vercel API proxy (/api/sb)
// to avoid ISP-level blocking of Supabase domains.
// In dev, connect directly (the API proxy doesn't run in vite dev server).
let clientSupabaseUrl = originalSupabaseUrl;
if (
  typeof window !== 'undefined' &&
  originalSupabaseUrl &&
  !originalSupabaseUrl.includes('placeholder') &&
  import.meta.env.PROD
) {
  clientSupabaseUrl = `${window.location.origin}/api/sb`;
}

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
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  }
);

// Helper to check if we're in demo mode (no Supabase configured)
export const isDemoMode = (): boolean => {
  return !isSupabaseConfigured();
};
