import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Extract data using multiple free public APIs
async function scrapeWithAllOrigins(url: string) {
  const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('AllOrigins failed');
  return await res.text();
}

async function scrapeWithCorsproxy(url: string) {
  const apiUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('Corsproxy failed');
  return await res.text();
}

// Parse product data from HTML
function parseProductFromHTML(html: string, url: string) {
  const urlLower = url.toLowerCase();

  // Try JSON-LD structured data first (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
        const data = JSON.parse(jsonContent);
        const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);
        if (product) {
          const price = product.offers?.price || product.offers?.lowPrice || 0;
          const images = product.image ? (Array.isArray(product.image) ? product.image : [product.image]) : [];
          return {
            title: product.name || '',
            description: product.description || '',
            price: parseFloat(price) || 0,
            images: images.filter((img: string) => img && img.startsWith('http')),
            currency: product.offers?.priceCurrency || 'YER',
          };
        }
      } catch (e) { /* skip invalid JSON-LD */ }
    }
  }

  // Try Open Graph meta tags
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] || '';
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                 html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1] || '';
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                  html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1] || '';

  // Try standard meta tags
  const metaTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

  // Try to find price patterns
  let price = 0;
  const pricePatterns = [
    /["']price["']\s*:\s*["']?(\d+[\.,]?\d*)["']?/i,
    /data-price=["'](\d+[\.,]?\d*)["']/i,
    /class=["'][^"']*price[^"']*["'][^>]*>[\s\S]*?(\d+[\.,]?\d*)/i,
    /(\d{2,6})\s*(ر\.ي|ريال|YER|SAR|USD|\$)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(',', '.'));
      if (price > 0) break;
    }
  }

  // Try to find all product images
  const images: string[] = [];
  if (ogImage) images.push(ogImage);

  // Find images from meta tags
  const ogImages = html.matchAll(/<meta[^>]*property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/gi);
  for (const m of ogImages) {
    if (m[1] && !images.includes(m[1])) images.push(m[1]);
  }

  // Find product images from common patterns
  const imgPatterns = [
    /["']image["']\s*:\s*["']([^"']+)["']/gi,
    /data-src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
    /src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
  ];
  for (const pattern of imgPatterns) {
    const matches = html.matchAll(pattern);
    for (const m of matches) {
      if (m[1] && m[1].startsWith('http') && !images.includes(m[1]) && images.length < 10) {
        // Filter out tiny icons and logos
        if (!m[1].includes('icon') && !m[1].includes('logo') && !m[1].includes('favicon')) {
          images.push(m[1]);
        }
      }
    }
  }

  const title = ogTitle || metaTitle || '';
  const description = ogDesc || metaDesc || '';

  return { title, description, price, images: images.slice(0, 8), currency: 'YER' };
}

// Zahraah-specific: try fetching from their API
async function tryZahraahAPI(url: string) {
  // Extract product slug from URL like /ar/products/rz-3222
  const slugMatch = url.match(/\/products\/([a-zA-Z0-9\-]+)/);
  if (!slugMatch) return null;
  const slug = slugMatch[1];

  // Try their known API endpoint patterns
  const apiUrls = [
    `https://zahraah.com/api/products/${slug}`,
    `https://zahraah.com/api/v1/products/${slug}`,
  ];

  for (const apiUrl of apiUrls) {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && (data.name || data.title || data.data?.name)) {
            const product = data.data || data;
            return {
              title: product.name || product.title || '',
              description: product.description || product.desc || '',
              price: product.price || product.sale_price || 0,
              images: (product.images || product.gallery || []).map((img: any) => typeof img === 'string' ? img : img.url || img.src || '').filter(Boolean),
              currency: 'YER',
            };
          }
        } catch (e) { /* not JSON */ }
      }
    } catch (e) { /* skip */ }
  }
  return null;
}

// SHEIN-specific parsing  
async function trySheinParsing(url: string) {
  try {
    const html = await scrapeWithAllOrigins(url);
    
    // SHEIN uses specific meta patterns  
    const title = html.match(/property="og:title"[^>]*content="([^"]+)"/i)?.[1] || 
                  html.match(/content="([^"]+)"[^>]*property="og:title"/i)?.[1] || '';
    const image = html.match(/property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
                  html.match(/content="([^"]+)"[^>]*property="og:image"/i)?.[1] || '';
    const priceMatch = html.match(/["']price["']\s*:\s*["']?(\d+\.?\d*)["']?/i);
    
    if (title) {
      return {
        title,
        description: html.match(/property="og:description"[^>]*content="([^"]+)"/i)?.[1] || title,
        price: priceMatch ? parseFloat(priceMatch[1]) : 0,
        images: image ? [image] : [],
        currency: 'SAR',
      };
    }
  } catch (e) { /* skip */ }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const urlLower = url.toLowerCase();
    let result = null;

    // 1. Try site-specific APIs first
    if (urlLower.includes('zahraah.com')) {
      result = await tryZahraahAPI(url);
    } else if (urlLower.includes('shein.com')) {
      result = await trySheinParsing(url);
    }

    // 2. If site-specific failed, try general scraping
    if (!result || !result.title) {
      let html = '';
      try {
        html = await scrapeWithAllOrigins(url);
      } catch (e) {
        try {
          html = await scrapeWithCorsproxy(url);
        } catch (e2) {
          throw new Error('All proxy services failed to fetch the URL');
        }
      }

      if (html.length > 0) {
        result = parseProductFromHTML(html, url);
      }
    }

    if (!result || (!result.title && result.images.length === 0)) {
      return res.status(200).json({
        success: false,
        error: 'Could not extract product data. The site may block automated access.',
        data: { title: '', description: '', price: 0, images: [], currency: 'YER' }
      });
    }

    return res.status(200).json({ success: true, data: result });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Failed to scrape product',
      data: { title: '', description: '', price: 0, images: [], currency: 'YER' }
    });
  }
}
