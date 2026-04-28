import type { VercelRequest, VercelResponse } from '@vercel/node';
import { load } from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Test cheerio
    const $ = load('<html><body><h1>Hello</h1></body></html>');
    const title = $('h1').text();

    return res.status(200).json({ 
      success: true, 
      title,
      message: 'Cheerio is working!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
