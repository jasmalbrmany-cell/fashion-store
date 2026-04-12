-- ============================================
-- Supabase Storage Setup for Product Images
-- ============================================
-- Run this script in Supabase SQL Editor

-- Create products bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to product images
DROP POLICY IF EXISTS "Public read access to products" ON storage.objects;
CREATE POLICY "Public read access to products"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Policy 2: Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload to products" ON storage.objects;
CREATE POLICY "Authenticated users can upload to products"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow admins and editors to update images
DROP POLICY IF EXISTS "Admins and editors can update products" ON storage.objects;
CREATE POLICY "Admins and editors can update products"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Policy 4: Allow admins to delete images
DROP POLICY IF EXISTS "Admins can delete from products" ON storage.objects;
CREATE POLICY "Admins can delete from products"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'products';
