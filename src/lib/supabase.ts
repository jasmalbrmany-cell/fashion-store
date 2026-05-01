import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Supabase configuration
const originalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// Detect dangerous service role key in client env
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_SERVICE_ROLE || '';
if (typeof window !== 'undefined' && supabaseServiceRoleKey) {
  // Fail fast in the browser to prevent accidental destructive operations
  // and force the developer to rotate keys and remove the secret from client env.
  // This is an intentional hard stop for security.
  // See IMMEDIATE_ACTIONS.md for remediation steps.
  // eslint-disable-next-line no-console
  console.error('⚠️ SECURITY: Detected Supabase service_role key in frontend environment. Remove it from client env and rotate keys immediately.');
  throw new Error('Supabase service_role key detected in frontend environment — application halted for security.');
}
const forceProxy = String(import.meta.env.VITE_SUPABASE_FORCE_PROXY || '').toLowerCase() === 'true';

const PROXY_PATH = '/api/sb';
const DIRECT_MODE_KEY = 'supabase_use_direct';

const getProxyUrl = (): string => {
  if (typeof window === 'undefined') return PROXY_PATH;
  return `${window.location.origin}${PROXY_PATH}`;
};

const getInitialClientUrl = (): string => {
  if (!originalSupabaseUrl) return getProxyUrl();
  if (forceProxy) return getProxyUrl();

  if (typeof window !== 'undefined') {
    const cachedMode = localStorage.getItem(DIRECT_MODE_KEY);
    if (cachedMode === 'false') return getProxyUrl();
  }

  // Prefer direct by default; fallback logic in auth/service handles network failures.
  return originalSupabaseUrl;
};

// Smart Gateway: Detection of direct connection availability
const clientSupabaseUrl = getInitialClientUrl();

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
        localStorage.setItem(DIRECT_MODE_KEY, 'true');
      }
    } catch (e) {
      console.log('🔌 Direct connection blocked or slow. Using Vercel Proxy Gateway.');
      localStorage.setItem(DIRECT_MODE_KEY, 'false');
    }
  };

  if (!forceProxy) {
    checkDirectConnection();
  }
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const hasKey = Boolean(supabaseAnonKey && supabaseAnonKey !== '' && !supabaseAnonKey.includes('placeholder'));
  const hasUrl = Boolean(originalSupabaseUrl && originalSupabaseUrl !== '' && !originalSupabaseUrl.includes('placeholder'));
  
  // In production, we might rely solely on the proxy (/api/sb) if the URL is missing
  // but we absolutely need the Anon Key for the proxy to work or for direct connection.
  return hasKey && (hasUrl || typeof window !== 'undefined');
};

// Create Supabase client
export const supabase = createClient<Database>(
  clientSupabaseUrl || originalSupabaseUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/sb` : 'https://placeholder.supabase.co'),
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
