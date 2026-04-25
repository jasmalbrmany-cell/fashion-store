import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import http from 'http';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info,x-supabase-api-version,prefer,accept,accept-encoding,accept-language,cache-control,pragma,x-requested-with');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range,X-Content-Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_URL) {
    return res.status(500).json({ error: 'Supabase URL not configured' });
  }

  // Build the target path: /api/sb/auth/v1/token → /auth/v1/token
  const incomingPath = (req.url || '').replace(/^\/api\/sb/, '');
  const targetUrl = new URL(incomingPath || '/', SUPABASE_URL);

  // Forward query params
  const incomingUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Build headers to forward
  const forwardHeaders: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'content-type': (req.headers['content-type'] as string) || 'application/json',
  };

  if (req.headers['authorization']) {
    forwardHeaders['authorization'] = req.headers['authorization'] as string;
  }
  if (req.headers['x-client-info']) {
    forwardHeaders['x-client-info'] = req.headers['x-client-info'] as string;
  }
  if (req.headers['x-supabase-api-version']) {
    forwardHeaders['x-supabase-api-version'] = req.headers['x-supabase-api-version'] as string;
  }
  if (req.headers['prefer']) {
    forwardHeaders['prefer'] = req.headers['prefer'] as string;
  }

  const body = req.body ? JSON.stringify(req.body) : undefined;
  if (body) {
    forwardHeaders['content-length'] = Buffer.byteLength(body).toString();
  }

  return new Promise<void>((resolve) => {
    const isHttps = targetUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: targetUrl.pathname + (targetUrl.search || ''),
      method: req.method,
      headers: forwardHeaders,
    };

    const proxyReq = lib.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode || 200);

      // Forward response headers
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value !== undefined && key !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      // Re-add CORS since supabase might overwrite them
      res.setHeader('Access-Control-Allow-Origin', '*');

      const chunks: Buffer[] = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const responseBody = Buffer.concat(chunks);
        res.end(responseBody);
        resolve();
      });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.status(502).json({ error: 'Proxy error', message: err.message });
      resolve();
    });

    proxyReq.setTimeout(25000, () => {
      proxyReq.destroy(new Error('Request timeout'));
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
}
