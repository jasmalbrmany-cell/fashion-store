-- ============================================================
-- 🛡️ FASHION HUB — SECURITY HARDENING MIGRATION
-- ============================================================
-- Purpose: Fix critical security vulnerabilities identified in the audit.
-- Date: 2026-04-28
-- ============================================================

-- ─── 1. FIX PROFILES RLS (Vulnerability: Data Leak & Anon Insert) ───
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_restricted" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles; -- 🛡️ Drop legacy insecure policy

-- Only allow users to see their own profile, OR admins/editors to see everyone
CREATE POLICY "profiles_select_restricted" ON public.profiles
FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- Prevent anonymous inserts. User must be authenticated and id must match auth.uid()
CREATE POLICY "profiles_insert_authenticated" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = id
);


-- ─── 2. PROTECT EXTERNAL STORES (Vulnerability: Plaintext Passwords) ───
-- It is highly recommended NOT to store plaintext passwords. 
-- For now, we restrict access to ONLY admins and editors.
DROP POLICY IF EXISTS "external_stores_admin_only" ON public.external_stores;
DROP POLICY IF EXISTS "external_stores_admin" ON public.external_stores;
DROP POLICY IF EXISTS "Admins can manage external stores" ON public.external_stores;
DROP POLICY IF EXISTS "Viewers can view external stores" ON public.external_stores;

CREATE POLICY "external_stores_admin_only" ON public.external_stores
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
);


-- ─── 3. HARDEN SECURITY DEFINER FUNCTIONS (Vulnerability: Search Path) ───
-- Functions with SECURITY DEFINER should always have a fixed search_path to prevent hijacking.
ALTER FUNCTION public.handle_new_user() SET search_path = public;


-- ─── 4. REMOVE AUTOMATIC EMAIL CONFIRMATION (Vulnerability: Impersonation) ───
-- This logic is dangerous and has been removed from execution.


-- ─── 5. ORDERS RLS HARDENING (Vulnerability: Anonymous Order Insertion) ───
DROP POLICY IF EXISTS "orders_insert_anyone" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_secure" ON public.orders;
DROP POLICY IF EXISTS "Anyone create orders" ON public.orders; -- 🛡️ Drop legacy insecure policy

-- STRICT: Only authenticated users can create orders.
CREATE POLICY "orders_insert_secure" ON public.orders
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);


-- ─── 6. ACTIVITY LOGS HARDENING ───
DROP POLICY IF EXISTS "activity_logs_insert_any" ON public.activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_auth" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_auth" ON public.activity_logs
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);

-- ============================================================
-- ✅ HARDENING COMPLETE
-- ============================================================
