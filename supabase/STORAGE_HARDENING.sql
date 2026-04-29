-- ============================================================
-- 🖼️ SUPABASE STORAGE SECURITY POLICY (Hardening)
-- ============================================================
-- Purpose: Ensure images are public but protected from unauthorized management.
-- ============================================================

-- 1. Ensure the 'products' bucket is public for viewing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'products';

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;

-- 3. Policy: Everyone can view images in the 'products' bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'products');

-- 4. Policy: Only Authenticated Admins/Editors can Upload/Update/Delete
CREATE POLICY "Admin Full Access" ON storage.objects
FOR ALL 
TO authenticated
USING (
    bucket_id = 'products' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
)
WITH CHECK (
    bucket_id = 'products' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
);

-- ============================================================
-- ✅ STORAGE HARDENING COMPLETE
-- ============================================================
