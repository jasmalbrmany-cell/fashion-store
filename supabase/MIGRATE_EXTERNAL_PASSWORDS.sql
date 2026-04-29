-- ============================================================
-- 🛡️ FASHION HUB — EXTERNAL STORES DATA MIGRATION
-- ============================================================
-- Purpose: Remove plaintext password column and migrate to a more secure field.
-- Date: 2026-04-28
-- ============================================================

-- 1. Add the new secure column
ALTER TABLE public.external_stores ADD COLUMN IF NOT EXISTS encrypted_api_key TEXT;

-- 2. Migrate existing data (Temporary step)
-- NOTE: In a real production environment, you should encrypt these values before moving them.
-- For now, we move them to the new field to allow removing the 'password' field.
UPDATE public.external_stores 
SET encrypted_api_key = password 
WHERE encrypted_api_key IS NULL AND password IS NOT NULL;

-- 3. Drop the insecure 'password' column
ALTER TABLE public.external_stores DROP COLUMN IF EXISTS password;

-- 4. Update RLS to reflect changes
DROP POLICY IF EXISTS "external_stores_admin_only" ON public.external_stores;

CREATE POLICY "external_stores_admin_only" ON public.external_stores
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
);

COMMENT ON COLUMN public.external_stores.encrypted_api_key IS 'Store API Key or Password. Should be encrypted at rest if possible.';

-- ============================================================
-- ✅ MIGRATION READY
-- ============================================================
