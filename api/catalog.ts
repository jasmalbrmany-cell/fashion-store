import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url } = req.body || {};
    
    // Very simple regex-based scraper for test
    if (!url) return res.status(400).json({ error: 'URL is required' });

    return res.status(200).json({ 
      success: true, 
      products: [
        {
          id: 'test-1',
          name: 'Test Product from ' + url,
          price: 100,
          currency: 'SAR',
          images: [],
          sizes: ['L'],
          colors: [{ name: 'Black', hex: '#000000' }],
          sourceUrl: url,
          category: 'Test'
        }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
