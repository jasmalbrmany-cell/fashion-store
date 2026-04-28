import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { url } = req.body || {};
    return res.status(200).json({ 
      success: true, 
      message: 'Scraper test working',
      receivedUrl: url || 'none'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
