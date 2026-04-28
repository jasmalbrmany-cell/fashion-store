import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Return 403 Forbidden instantly for any Realtime attempt to stop browser waiting/retrying
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(403).json({ error: 'Realtime not supported through proxy' });
}
