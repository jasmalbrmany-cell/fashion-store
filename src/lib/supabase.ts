import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Smart Gateway: Detection of direct connection availability
let clientSupabaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/sb` : '/api/sb';

if (typeof window !== 'undefined' && originalSupabaseUrl) {
  // Try to see if we can reach Supabase directly (bypassing ISP blocks)
  // We use a very short timeout for this check to not delay app start
  const checkDirectConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${originalSupabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: { 'apikey': supabaseAnonKey },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok || response.status === 401) {
        console.log('🚀 Direct connection to Supabase is available. Bypassing proxy for speed.');
        // Update the client instance if possible or just use a flag
        // Since the client is already created, we might need a more dynamic approach
        // But for most requests, we'll use this detection
        localStorage.setItem('supabase_use_direct', 'true');
      }
    } catch (e) {
      console.log('🔌 Direct connection blocked or slow. Using Vercel Proxy Gateway.');
      localStorage.setItem('supabase_use_direct', 'false');
    }
  };
  
  checkDirectConnection();
  
  // If we already know from a previous session that direct works, use it immediately
  if (localStorage.getItem('supabase_use_direct') === 'true') {
    clientSupabaseUrl = originalSupabaseUrl;
  }
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
      storageKey: 'supabase.auth.token',
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key',
      },
    },
    // Disable Realtime — not supported by Vercel proxy and causes WebSocket errors
    realtime: {
      params: {
        eventsPerSecond: 0,
      }
    },
  }
);

// Helper to check if we're in demo mode (no Supabase configured)
export const isDemoMode = (): boolean => {
  return !isSupabaseConfigured();
};
