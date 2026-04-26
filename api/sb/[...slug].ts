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
  // req.query.slug = ['auth', 'v1', 'token']  →  /auth/v1/token
  const slugParts = req.query.slug;
  const pathSegments = Array.isArray(slugParts) ? slugParts : [slugParts ?? ''];
  const targetPath = '/' + pathSegments.join('/');

  // Forward query string params (excluding the internal 'slug' param)
  const qs = new URLSearchParams();
  Object.entries(req.query).forEach(([key, val]) => {
    if (key === 'slug') return;
    if (Array.isArray(val)) val.forEach(v => qs.append(key, v));
    else if (val != null) qs.append(key, val);
  });
  const fullPath = targetPath + (qs.toString() ? `?${qs.toString()}` : '');

  // ── Headers to forward ────────────────────────────────────────────────
  const fwd: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'content-type': (req.headers['content-type'] as string) || 'application/json',
  };
  const passThrough = ['authorization', 'x-client-info', 'prefer', 'x-supabase-api-version', 'range'];
  passThrough.forEach(h => { if (req.headers[h]) fwd[h] = req.headers[h] as string; });

  // Serialize body
  let bodyStr: string | undefined;
  if (req.body) {
    bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    fwd['content-length'] = Buffer.byteLength(bodyStr).toString();
  }

  const supabaseHost = new URL(SUPABASE_URL).hostname;

  // ── Proxy request ─────────────────────────────────────────────────────
  return new Promise<void>(resolve => {
    const proxyReq = https.request(
      { hostname: supabaseHost, port: 443, path: fullPath, method: req.method, headers: fwd },
      proxyRes => {
        res.status(proxyRes.statusCode ?? 200);

        // Forward response headers (skip hop-by-hop)
        Object.entries(proxyRes.headers).forEach(([k, v]) => {
          if (v !== undefined && k !== 'transfer-encoding' && k !== 'connection') {
            res.setHeader(k, v);
          }
        });
        // Re-assert CORS (Supabase may overwrite)
        res.setHeader('Access-Control-Allow-Origin', '*');

        const chunks: Buffer[] = [];
        proxyRes.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        proxyRes.on('end', () => { res.end(Buffer.concat(chunks)); resolve(); });
        proxyRes.on('error', () => { res.end(); resolve(); });
      }
    );

    proxyReq.setTimeout(25000, () => proxyReq.destroy(new Error('Upstream timeout')));
    proxyReq.on('error', err => {
      console.error('[sb-proxy] error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'proxy_error', message: err.message });
      resolve();
    });

    if (bodyStr) proxyReq.write(bodyStr);
    proxyReq.end();
  });
}
