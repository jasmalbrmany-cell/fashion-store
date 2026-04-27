import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 75;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for incoming images

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration is missing' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Initialize Supabase client with the user's auth token to pass RLS policies
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      }
    });

    // Fetch the image from the external URL with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const imageResponse = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // Skip files that are too large
    if (originalBuffer.length > MAX_FILE_SIZE) {
      throw new Error('Image too large (max 5MB)');
    }

    // Compress and resize using sharp
    let compressedBuffer: Buffer;
    let finalContentType = 'image/jpeg';

    try {
      compressedBuffer = await sharp(originalBuffer)
        .resize(MAX_WIDTH, undefined, { 
          withoutEnlargement: true,  // Don't upscale small images
          fit: 'inside' 
        })
        .jpeg({ quality: JPEG_QUALITY, progressive: true })
        .toBuffer();
    } catch (sharpError) {
      // If sharp fails (e.g. unsupported format), fall back to original
      console.warn('Sharp compression failed, using original:', sharpError);
      compressedBuffer = originalBuffer;
      finalContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    }

    const savedPercent = originalBuffer.length > 0 
      ? Math.round((1 - compressedBuffer.length / originalBuffer.length) * 100) 
      : 0;

    // Generate a unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, compressedBuffer, {
        contentType: finalContentType,
        cacheControl: '31536000', // Cache for 1 year (immutable content)
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return res.status(200).json({ 
      success: true, 
      originalUrl: url,
      supabaseUrl: publicUrlData.publicUrl,
      originalSize: originalBuffer.length,
      compressedSize: compressedBuffer.length,
      savedPercent,
    });

  } catch (error: any) {
    console.error('Upload external image error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
