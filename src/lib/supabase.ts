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

// Clear old poisoned state if it exists
if (typeof window !== 'undefined') {
  localStorage.removeItem(DIRECT_MODE_KEY);
}

const getProxyUrl = (): string => {
  if (typeof window === 'undefined') return PROXY_PATH;
  return `${window.location.origin}${PROXY_PATH}`;
};

const getInitialClientUrl = (): string => {
  if (!originalSupabaseUrl) return getProxyUrl();
  if (forceProxy) return getProxyUrl();

  // Prefer direct by default; fallback logic in auth/service handles network failures.
  return originalSupabaseUrl;
};

const clientSupabaseUrl = getInitialClientUrl();

// Check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  // إذا كنا في المتصفح، يكون الـ Proxy (/api/sb) متاحاً دائماً عبر Vercel
  // الـ Proxy يستخدم مفاتيح الخادم (SUPABASE_URL, SUPABASE_ANON_KEY) ويحقن الاعتمادات تلقائياً
  // لذلك لا نحتاج VITE_ vars في الـ Frontend لكي يعمل الاتصال
  if (typeof window !== 'undefined') {
    return true; // الـ Proxy متاح دائماً - يمرر الطلبات لـ Supabase مع المفاتيح الصحيحة
  }
  // في بيئة الخادم (SSR / API functions) نتحقق من المفاتيح المباشرة
  return Boolean(originalSupabaseUrl && supabaseAnonKey);
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
