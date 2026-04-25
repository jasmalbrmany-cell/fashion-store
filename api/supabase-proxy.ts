import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey,x-client-info,prefer,range,x-supabase-api-version');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SB_URL) return res.status(500).json({ error: 'SUPABASE_URL not configured' });

  const rawPath = (req.query.proxypath as string) || '';
  const qs = new URLSearchParams();
  Object.entries(req.query).forEach(([k, v]) => {
    if (k === 'proxypath') return;
    (Array.isArray(v) ? v : [v]).forEach(x => x && qs.append(k, x));
  });
  const fullPath = '/' + rawPath + (qs.toString() ? '?' + qs.toString() : '');
  const host = new URL(SB_URL).hostname;

  const fwd: Record<string, string> = {
    apikey: SB_KEY,
    'content-type': (req.headers['content-type'] as string) || 'application/json',
  };
  ['authorization', 'x-client-info', 'prefer', 'range', 'x-supabase-api-version'].forEach(h => {
    if (req.headers[h]) fwd[h] = req.headers[h] as string;
  });
  const body = req.body ? JSON.stringify(req.body) : undefined;
  // Note: Do NOT set content-length manually — let Node.js use chunked encoding

  return new Promise<void>(resolve => {
    const pr = https.request({ hostname: host, port: 443, path: fullPath, method: req.method, headers: fwd }, upstream => {
      res.status(upstream.statusCode ?? 200);
      Object.entries(upstream.headers).forEach(([k, v]) => {
        if (v != null && k !== 'transfer-encoding' && k !== 'connection') res.setHeader(k, v);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      const chunks: Buffer[] = [];
      upstream.on('data', c => chunks.push(Buffer.from(c)));
      upstream.on('end', () => { res.end(Buffer.concat(chunks)); resolve(); });
    });
    pr.setTimeout(25000, () => pr.destroy(new Error('timeout')));
    pr.on('error', err => { if (!res.headersSent) res.status(502).json({ error: err.message }); resolve(); });
    if (body) pr.write(body);
    pr.end();
  });
}
