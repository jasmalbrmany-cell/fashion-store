import type { VercelRequest, VercelResponse } from '@vercel/node';
import { load } from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { scrapeWithFirecrawl } from './_lib/firecrawl';

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchHTML(url: string, timeout = 8000): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });
    if (res.ok) return await res.text();
  } catch (err) {
    console.warn(`[Catalog] Direct fetch failed for ${url}`);
  } finally {
    clearTimeout(t);
  }

  // Proxy fallbacks
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  
  for (const proxy of proxies) {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 6000);
    try {
      const res = await fetch(proxy, { signal: c.signal });
      if (res.ok) return await res.text();
    } catch (err) { console.warn(`[Catalog] Proxy fetch failed for ${proxy}:`, err); } finally { clearTimeout(timer); }
  }
  return '';
}

// ─── Shein Scraper (Inlined) ──────────────────────────────────────────────────
function scrapeSheinCategory(html: string, url: string) {
  try {
    const jsonMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({.+?});/s) || 
                      html.match(/window\.gbData\s*=\s*({.+?});/s);
    if (!jsonMatch) return [];
    const data = JSON.parse(jsonMatch[1]);
    const goodsList = data.goodsList || data.catGoodsList || [];
    const origin = new URL(url).origin;
    
    return goodsList.map((g: any) => ({
      id: g.goods_id?.toString() || Math.random().toString(36).substr(2, 9),
      name: g.goods_name || '',
      price: parseFloat(g.salePrice?.amount || g.retailPrice?.amount || '0'),
      currency: g.salePrice?.currency || 'USD',
      images: [g.goods_img].filter(Boolean).map((img: string) => img.startsWith('//') ? 'https:' + img : img),
      sourceUrl: g.url ? (g.url.startsWith('http') ? g.url : origin + g.url) : '',
    }));
  } catch { return []; }
}

function normalizeCurrency(url: string): string {
  const urlL = url.toLowerCase();
  if (urlL.includes('.ye') || urlL.includes('yemen')) return 'YER';
  if (urlL.includes('.sa') || urlL.includes('zahraah')) return 'SAR';
  return 'USD';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { url, page = 1 } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    const urlL = url.toLowerCase();
    const html = await fetchHTML(url);
    if (!html) throw new Error('Could not fetch website content');

    let products: any[] = [];
    let strategy = 'generic';

    if (urlL.includes('shein.com')) {
      products = scrapeSheinCategory(html, url);
      strategy = 'shein';
    } else if (FIRECRAWL_API_KEY) {
      const firecrawlProds = await scrapeWithFirecrawl(url, FIRECRAWL_API_KEY);
      if (firecrawlProds.length > 0) {
        products = firecrawlProds;
        strategy = 'firecrawl';
      }
    }

    if (products.length === 0 && !urlL.includes('shein.com')) {
      // Use Cheerio for all other sites (Zahraah, WooCommerce, Shopify, etc.)
      const $ = load(html);
      const base = new URL(url).origin;
      const seen = new Set();

      // 1. JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '');
          const items = data.itemListElement || data.mainEntity?.itemListElement || (Array.isArray(data) ? data : []);
          items.forEach((item: any) => {
            const p = item.item || item;
            if (p.url && p.name && !seen.has(p.url)) {
              seen.add(p.url);
              products.push({
                name: p.name,
                price: parseFloat(p.offers?.price || p.offers?.[0]?.price || '0'),
                image: p.image || (Array.isArray(p.image) ? p.image[0] : ''),
                href: p.url.startsWith('/') ? base + p.url : p.url
              });
            }
          });
        } catch (e) { console.debug('[Catalog] JSON-LD parse failed:', e); }
      });

      // 2. CSS Selectors (Zahraah/Salla/Woo)
      if (products.length < 5) {
        const cardSelectors = [
          '.s-product-card', '.product-card', '.product-item', 
          '[class*="product-card"]', '.product', '.item',
          '.product-block', '.product-thumb', '.product-grid-item',
          '.s-block-product-item'
        ];
        
        for (const selector of cardSelectors) {
          $(selector).each((_, el) => {
            const $el = $(el);
            // Look for any link that might be a product
            const link = $el.find('a[href*="/p/"], a[href*="/product/"], a[href*="/products/"], a[href*="/item/"]').first();
            const name = $el.find('h2, h3, h4, .title, .name, [class*="title"], [class*="name"]').first().text().trim();
            const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || $el.find('img').first().attr('srcset');
            const priceText = $el.find('.price, [class*="price"], [class*="amount"]').text();
            const priceMatch = priceText.match(/(\d[\d,.]+)/);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

            let pUrl = link.attr('href');
            if (name && pUrl && !seen.has(pUrl)) {
              if (pUrl.startsWith('/')) pUrl = base + pUrl;
              seen.add(pUrl);
              products.push({
                name,
                price,
                image: img || '',
                href: pUrl
              });
            }
          });
          if (products.length >= 10) break;
        }
      }
      strategy = products.length > 0 ? 'scrape' : 'none';
    }

    // Normalized for frontend
    const normalized = products.map(p => {
      // Fix relative image URLs
      let finalImg = p.image || '';
      if (finalImg.startsWith('//')) finalImg = 'https:' + finalImg;
      else if (finalImg.startsWith('/')) finalImg = new URL(url).origin + finalImg;
      const finalHref = (p.href || '').startsWith('/')
        ? new URL(url).origin + p.href
        : (p.href || '');

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: String(p.name || '').trim(),
        description: '',
        price: Number.isFinite(Number(p.price)) ? Number(p.price) : 0,
        currency: normalizeCurrency(url),
        images: finalImg ? [finalImg] : [],
        sizes: ['حسب الطلب'],
        colors: [{ name: 'متعدد', hex: '#888888' }],
        sourceUrl: finalHref,
        category: '',
      };
    }).filter(p => p.name.length > 0 && p.sourceUrl.length > 0);

    const pageSize = 24;
    const start = Math.max(0, (Number(page) - 1) * pageSize);
    const pagedProducts = normalized.slice(start, start + pageSize);
    const hasMore = start + pageSize < normalized.length;

    if (normalized.length === 0 && strategy === 'none') {
       return res.status(200).json({
         success: false,
         error: 'لم يتم العثور على منتجات. حاول استخدام رابط مباشر لقسم معين في الموقع (مثلاً قسم الفساتين).',
         strategy
       });
    }

    return res.status(200).json({
      success: normalized.length > 0,
      strategy,
      products: pagedProducts,
      hasMore,
      nextPage: hasMore ? Number(page) + 1 : null
    });

  } catch (err: any) {
    console.error('[Catalog] Error:', err.message);
    return res.status(200).json({ 
      success: false, 
      error: `فشل الاتصال: ${err.message}` 
    });
  }
}
