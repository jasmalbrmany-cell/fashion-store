import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Upload image to Supabase Storage
 * @param imageUrl - External image URL
 * @param productId - Product ID for organizing files
 * @returns Supabase Storage URL or original URL if upload fails
 */
export async function uploadImageToSupabase(
  imageUrl: string,
  productId: string
): Promise<string> {
  // If Supabase not configured, return original URL
  if (!isSupabaseConfigured()) {
    return imageUrl;
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imageUrl}`);
      return imageUrl;
    }

    const blob = await response.blob();
    
    // Generate unique filename
    const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '31536000', // 1 year
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return imageUrl;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return imageUrl; // Fallback to original URL
  }
}

/**
 * Upload multiple images to Supabase Storage
 * @param imageUrls - Array of external image URLs
 * @param productId - Product ID for organizing files
 * @returns Array of Supabase Storage URLs
 */
export async function uploadImagesToSupabase(
  imageUrls: string[],
  productId: string
): Promise<string[]> {
  const uploadPromises = imageUrls.map(url => uploadImageToSupabase(url, productId));
  return Promise.all(uploadPromises);
}

/**
 * Compress image before upload (optional, for better performance)
 * @param blob - Image blob
 * @param maxWidth - Maximum width
 * @param quality - JPEG quality (0-1)
 * @returns Compressed blob
 */
export async function compressImage(
  blob: Blob,
  maxWidth: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Setup Supabase Storage bucket (run once)
 * This should be run in Supabase SQL Editor
 */
export const STORAGE_SETUP_SQL = `
-- Create products bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'products' AND
    auth.role() = 'authenticated'
  );

-- Allow admins to delete
DROP POLICY IF EXISTS "Admins can delete" ON storage.objects;
CREATE POLICY "Admins can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'products' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
`;
