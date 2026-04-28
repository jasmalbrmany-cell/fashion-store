import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';
import { rateLimit, corsHeaders, handleOptions } from './_middleware';
import { scrapeSheinCategory, scrapeSheinProduct } from './_lib/shein';
import { supabase } from './_lib/supabase';

// ─── User Agents ──────────────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function randomUA(): string {
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
    
    if (res.ok) {
      const text = await res.text();
      return text || '';
    }
  } catch (err: any) {
    console.warn(`[Catalog] Direct fetch failed for ${url}:`, err.message);
  } finally {
    clearTimeout(t);
  }

  // Proxy fallback
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
    } catch { 
      // next 
    } finally {
      clearTimeout(timer);
    }
  }
  return '';
}

// ─── Scrapers ─────────────────────────────────────────────────────────────────
async function scrapeProducts(url: string): Promise<any[]> {
  const html = await fetchHTML(url);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const results: any[] = [];
  const base = new URL(url).origin;

  // Try JSON-LD first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '');
      const items = data.itemListElement || data.mainEntity?.itemListElement || [];
      items.forEach((item: any) => {
        const p = item.item || item;
        if (p.url && p.name) {
          results.push({
            name: p.name,
            price: parseFloat(p.offers?.price || '0'),
            image: p.image || '',
            href: p.url.startsWith('/') ? base + p.url : p.url
          });
        }
      });
    } catch {}
  });

  if (results.length > 2) return results;

  // Generic card selectors (Salla, WooCommerce, Shopify patterns)
  const cardSelectors = [
    '.product-card', '.product-item', '.s-product-card', 
    '[class*="product"]', '.product', '.item'
  ];

  for (const selector of cardSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const link = $el.find('a[href*="/p/"], a[href*="/product/"], a[href*="/products/"]').first();
      const name = $el.find('h2, h3, h4, .title, .name').first().text().trim();
      const img = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
      const priceText = $el.find('.price, [class*="price"]').first().text();
      const priceMatch = priceText.match(/(\d[\d,.]+)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

      if (name && link.attr('href')) {
        let pUrl = link.attr('href') || '';
        if (pUrl.startsWith('/')) pUrl = base + pUrl;
        results.push({
          name,
          price,
          image: img || '',
          href: pUrl
        });
      }
    });
    if (results.length > 2) break;
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  corsHeaders(res);
  
  try {
    const { url, page = 1 } = req.body || {};
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const urlL = url.toLowerCase();
    
    // Shein Special
    if (urlL.includes('shein.com')) {
      const html = await fetchHTML(url);
      const prods = await scrapeSheinCategory(html, url);
      return res.status(200).json({ success: true, strategy: 'shein', products: prods });
    }

    // Generic
    const scraped = await scrapeProducts(url);
    if (scraped.length > 0) {
      const products = scraped.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name,
        price: p.price,
        currency: 'SAR',
        images: p.image ? [p.image] : [],
        sizes: ['حسب الطلب'],
        colors: [{ name: 'متعدد', hex: '#888888' }],
        sourceUrl: p.href,
        category: '',
      }));
      return res.status(200).json({ success: true, strategy: 'scrape', products });
    }

    return res.status(200).json({ success: false, error: 'No products found' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
