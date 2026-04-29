-- ==========================================
-- 🚀 SUPER FIX DATABASE SCRIPT
-- ==========================================
-- 1. Fix Categories (Add WhatsApp Number)
-- 2. Fix Ads Table
-- 3. Fix Storage Bucket for Product Images
-- ==========================================

-- 1. Update Categories Table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 2. Fix Storage for Images (Ensure bucket exists and policies are correct)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove old policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete" ON storage.objects;

-- Create solid policies
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Admin Full Access" 
ON storage.objects FOR ALL 
TO authenticated
USING (
    bucket_id = 'products' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
)
WITH CHECK (
    bucket_id = 'products' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- 3. Update Ads Table (ensure it has video_url and everything needed)
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'video', 'text')),
    content text,
    image_url text,
    video_url text,
    link text,
    position text NOT NULL,
    is_active boolean DEFAULT true,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ads Policies
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ads are viewable by everyone." ON public.ads;
CREATE POLICY "Ads are viewable by everyone." ON public.ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage ads." ON public.ads;
CREATE POLICY "Admins can manage ads." ON public.ads FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
