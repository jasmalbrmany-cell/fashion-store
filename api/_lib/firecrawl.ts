
import { Product } from '@/types';

export async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any[]> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url,
        formats: ['json'],
        jsonOptions: {
          schema: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    price: { type: 'number' },
                    description: { type: 'string' },
                    images: { type: 'array', items: { type: 'string' } },
                    sizes: { type: 'array', items: { type: 'string' } },
                    colors: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['name', 'price']
                }
              }
            }
          }
        }
      })
    });

    const data = await response.json();
    if (data.success && data.data?.json?.products) {
      return data.data.json.products.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name,
        description: p.description || '',
        price: p.price,
        currency: 'USD', // Will be adjusted in main handler
        images: p.images || [],
        sizes: p.sizes || ['حسب الطلب'],
        colors: (p.colors || []).map((c: string) => ({ name: c, hex: '#888888' })),
        sourceUrl: url,
        category: '',
      }));
    }
    return [];
  } catch (error) {
    console.error('Firecrawl scraping failed:', error);
    return [];
  }
}
