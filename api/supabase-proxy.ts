import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── CORS ──────────────────────────────────────────────────────────────
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

  // ── Build target path ─────────────────────────────────────────────────
  const rawPath = (req.query.proxypath as string) || '';
  const targetPath = '/' + rawPath;

  // Forward query string params
  const qs = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key === 'proxypath' || key === 'path') return;
    if (Array.isArray(val)) val.forEach(v => qs.append(key, v));
    else if (val != null) qs.append(key, val);
  });
  const fullPath = targetPath + (qs.toString() ? `?${qs.toString()}` : '');

  // ── Headers to forward ────────────────────────────────────────────────
  const fwdHeaders = new Headers();
  
  // Forward all headers from original request
  Object.entries(req.headers).forEach(([k, v]) => {
    if (['host', 'connection', 'content-length', 'accept-encoding'].includes(k.toLowerCase())) return;
    if (v) fwdHeaders.set(k, Array.isArray(v) ? v[0] : v);
  });

  // Ensure apikey is present
  fwdHeaders.set('apikey', SUPABASE_ANON_KEY);

  try {
    const targetUrl = `${SUPABASE_URL}${fullPath}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: fwdHeaders,
      signal: controller.signal
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    // Forward status code
    res.status(response.status);

    // Forward headers
    response.headers.forEach((v, k) => {
      const lowerK = k.toLowerCase();
      if (!['transfer-encoding', 'connection', 'content-encoding', 'access-control-allow-origin'].includes(lowerK)) {
        res.setHeader(k, v);
      }
    });

    // Re-assert CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send body
    const body = await response.arrayBuffer();
    res.send(Buffer.from(body));

  } catch (err: any) {
    console.error('[sb-proxy] error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Gateway Timeout', message: 'The upstream server took too long to respond.' });
    }
    res.status(502).json({ 
      error: 'proxy_error', 
      message: err.message,
      debug: { path: fullPath, method: req.method }
    });
  }
}
