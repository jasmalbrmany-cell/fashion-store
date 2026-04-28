import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

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
  const fwd: Record<string, string> = {};
  
  // Forward all headers from original request
  Object.entries(req.headers).forEach(([k, v]) => {
    // Skip some headers that should be set by us or are hop-by-hop
    if (['host', 'connection', 'content-length', 'accept-encoding'].includes(k.toLowerCase())) return;
    if (v) fwd[k] = Array.isArray(v) ? v[0] : v;
  });

  // Ensure apikey is present
  fwd['apikey'] = SUPABASE_ANON_KEY;

  // Serialize body
  let bodyBuffer: Buffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body) {
      const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      bodyBuffer = Buffer.from(bodyStr);
      fwd['content-length'] = bodyBuffer.length.toString();
    }
  }

  const supabaseHost = new URL(SUPABASE_URL).hostname;

  // ── Proxy request ─────────────────────────────────────────────────────
  return new Promise<void>(resolve => {
    const proxyReq = https.request(
      { 
        hostname: supabaseHost, 
        port: 443, 
        path: fullPath, 
        method: req.method, 
        headers: fwd 
      },
      proxyRes => {
        // Forward status code
        res.status(proxyRes.statusCode ?? 200);

        // Forward response headers (skip hop-by-hop)
        Object.entries(proxyRes.headers).forEach(([k, v]) => {
          const lowerK = k.toLowerCase();
          if (v !== undefined && !['transfer-encoding', 'connection', 'content-encoding', 'access-control-allow-origin'].includes(lowerK)) {
            res.setHeader(k, v);
          }
        });
        
        // Always re-assert CORS
        res.setHeader('Access-Control-Allow-Origin', '*');

        proxyRes.on('data', chunk => res.write(chunk));
        proxyRes.on('end', () => { 
          res.end(); 
          resolve(); 
        });
        proxyRes.on('error', (err) => { 
          console.error('[proxy-res-error]', err);
          res.end(); 
          resolve(); 
        });
      }
    );

    proxyReq.setTimeout(45000, () => {
      proxyReq.destroy(new Error('Upstream timeout after 45s'));
    });
    
    proxyReq.on('error', err => {
      console.error('[sb-proxy] request error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'proxy_error', 
          message: err.message,
          debug: { path: fullPath, method: req.method }
        });
      }
      resolve();
    });

    if (bodyBuffer) proxyReq.write(bodyBuffer);
    proxyReq.end();
  });
}
