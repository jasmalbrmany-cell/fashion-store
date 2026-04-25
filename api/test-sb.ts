import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const SB_URL = process.env.VITE_SUPABASE_URL || '';
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      has_url: !!SB_URL,
      url_prefix: SB_URL.substring(0, 40),
      has_key: !!SB_KEY,
      key_length: SB_KEY.length,
    },
  };

  if (!SB_URL) {
    return res.status(200).json({ ...result, status: 'ERROR', message: 'VITE_SUPABASE_URL not set' });
  }

  const host = new URL(SB_URL).hostname;

  return new Promise<void>(resolve => {
    const req2 = https.request(
      { hostname: host, port: 443, path: '/auth/v1/settings', method: 'GET', headers: { apikey: SB_KEY } },
      upstream => {
        const chunks: Buffer[] = [];
        upstream.on('data', c => chunks.push(Buffer.from(c)));
        upstream.on('end', () => {
          const body = Buffer.concat(chunks).toString();
          result.supabase_status = upstream.statusCode;
          result.supabase_response_preview = body.substring(0, 200);
          result.status = upstream.statusCode === 200 ? 'OK' : 'SUPABASE_ERROR';
          res.status(200).json(result);
          resolve();
        });
      }
    );
    req2.setTimeout(10000, () => {
      req2.destroy();
      result.status = 'SUPABASE_UNREACHABLE';
      result.message = 'Connection to Supabase timed out from Vercel servers';
      res.status(200).json(result);
      resolve();
    });
    req2.on('error', err => {
      result.status = 'CONNECTION_ERROR';
      result.message = err.message;
      res.status(200).json(result);
      resolve();
    });
    req2.end();
  });
}
