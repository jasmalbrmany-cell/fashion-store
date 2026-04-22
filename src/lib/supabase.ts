import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Bypass ISP blocking by routing through Vercel/Vite local proxy
// This applies to BOTH local and production, allowing users to access
// the site without a VPN.
let clientSupabaseUrl = originalSupabaseUrl;
if (typeof window !== 'undefined' && originalSupabaseUrl && !originalSupabaseUrl.includes('placeholder')) {
  clientSupabaseUrl = `${window.location.origin}/api/supabase`;
}

// ⚠️ SECURITY CHECK: Warn if service_role key is being used (should only use ANON_KEY)
if (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ SECURITY WARNING: VITE_SUPABASE_SERVICE_ROLE_KEY detected in environment. ' +
    'This should NEVER be exposed in client-side code. ' +
    'Only use VITE_SUPABASE_ANON_KEY for client applications.'
  );
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const isConfigured = Boolean(originalSupabaseUrl && supabaseAnonKey &&
    originalSupabaseUrl !== '' &&
    supabaseAnonKey !== '' &&
    !originalSupabaseUrl.includes('placeholder'));
  
  if (isConfigured && supabaseAnonKey.includes('service_role')) {
    console.warn('⚠️ SECURITY WARNING: service_role key detected in frontend environment variables. This key should be kept secret and only used in Edge Functions or backend services.');
  }

  return isConfigured;
};

// Create Supabase client with database types
export const supabase = createClient<Database>(
  clientSupabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper to check if we're in demo mode (no Supabase configured)
export const isDemoMode = (): boolean => {
  return !isSupabaseConfigured();
};
