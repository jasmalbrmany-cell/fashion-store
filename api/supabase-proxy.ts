import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,apikey,x-client-info,x-supabase-api-version,prefer,accept,range'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase not configured on server' });
  }

  // Build target path from proxypath
  const rawPath = (req.query.proxypath as string) || '';
  const targetPath = '/' + rawPath;
  const url = new URL(targetPath, SUPABASE_URL);
  
  // Forward query string params
  const qs = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key === 'proxypath' || key === 'path') return;
    if (Array.isArray(val)) val.forEach(v => qs.append(key, v));
    else if (val != null) qs.append(key, val);
  });
  url.search = qs.toString();

  try {
    const fetchHeaders: Record<string, string> = {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': (req.headers['content-type'] as string) || 'application/json',
    };
    
    // Pass along necessary auth and client headers
    const passThrough = ['authorization', 'x-client-info', 'prefer', 'x-supabase-api-version', 'range'];
    passThrough.forEach(h => { 
      if (req.headers[h]) fetchHeaders[h] = req.headers[h] as string; 
    });

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: fetchHeaders,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(url.toString(), fetchOptions);
    
    // Set status code
    res.status(response.status);

    // Forward response headers
    response.headers.forEach((val, key) => {
      if (key !== 'content-encoding' && key !== 'transfer-encoding') {
        res.setHeader(key, val);
      }
    });

    // Forward the response body
    // Using arrayBuffer is safer for any binary data/images, though Supabase API is mostly JSON
    const data = await response.arrayBuffer();
    res.send(Buffer.from(data));

  } catch (err: any) {
    console.error('[sb-proxy] error:', err.message);
    res.status(502).json({ error: 'proxy_error', message: err.message });
  }
}
