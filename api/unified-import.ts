// ─── configuration ───
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit, corsHeaders, handleOptions } from './_middleware';
import { scrapeSheinProduct } from './_lib/shein';
import { supabase } from './_lib/supabase';
import * as cheerio from 'cheerio';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

interface ImportResult {
  success: boolean;
  strategy: 'firecrawl' | 'direct' | 'jina' | 'proxy' | 'shein' | 'mapped_rules' | 'failed';
  data?: {
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    sizes: string[];
    colors: { name: string; hex: string }[];
    sourceUrl: string;
    suggestedCategory?: string;
  };
  error?: string;
  attempts: Record<string, boolean>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── LAYER 1: Direct Fetch ────────────────────
async function tryDirectFetch(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,*/*',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    }, 15000);
    if (!res.ok) return null;
    const html = await res.text();
    return html.length > 500 ? html : null;
  } catch {
    return null;
  }
}

// ─── LAYER 2: Firecrawl ──────────────────────────────────────────────────────
async function tryFirecrawl(url: string): Promise<ImportResult['data'] | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' }, description: { type: 'string' },
                price: { type: 'number' }, currency: { type: 'string' },
                images: { type: 'array', items: { type: 'string' } },
                sizes: { type: 'array', items: { type: 'string' } },
                colors: { type: 'array', items: { type: 'object' } },
              },
            },
          },
          onlyMainContent: false, waitFor: 2000,
        }),
      },
      25000
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    const ext = json.data?.extract;
    const md  = json.data?.markdown || '';
    return {
      title:       ext?.name        || extractFromMd(md, 'title'),
      description: ext?.description || extractFromMd(md, 'desc'),
      price:       ext?.price       || extractFromMd(md, 'price'),
      currency:    ext?.currency    || 'YER',
      images:      (ext?.images?.length ? ext.images : extractFromMd(md, 'images')).slice(0, 12),
      sizes:       ext?.sizes?.length ? ext.sizes : ['S', 'M', 'L', 'XL'],
      colors:      ext?.colors?.length ? ext.colors : [{ name: 'متعدد الألوان', hex: '#888888' }],
      sourceUrl: url,
    };
  } catch { return null; }
}

// ─── LAYER 3: Jina.ai ────────────────────────────────────────────────────────
async function tryJina(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(`https://r.jina.ai/${url}`, {}, 18000);
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 300 ? text : null;
  } catch { return null; }
}

// ─── HTML Parser ──────────────────────────────────────────────────────────────
async function getScrapingRule(url: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const { data } = await supabase.from('store_scraping_rules').select('*').ilike('domain', `%${domain}%`).eq('active', true).single();
    return data;
  } catch {
    return null;
  }
}

function parseHtml(html: string, url: string, rule: any = null): ImportResult['data'] {
  let title = '', description = '', price = 0;
  const images: string[] = [];
  const sizes = ['S', 'M', 'L', 'XL'];

  // Apply Dynamic Rules first!
  let usedRule = false;
  if (rule) {
    usedRule = true;
    try {
      const $ = cheerio.load(html);
      if (rule.name_selector) title = $(rule.name_selector).first().text().trim() || title;
      if (rule.description_selector) description = $(rule.description_selector).text().trim() || description;
      if (rule.price_selector) {
        const textPrice = $(rule.price_selector).first().text();
        const pm = textPrice.match(/(\d[\d,.]+)/);
        if (pm) price = parseFloat(pm[1].replace(/,/g, ''));
      }
      if (rule.image_selector) {
        $(rule.image_selector).each((_, el) => {
          let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('href');
          if (src && !images.includes(src)) {
            if (src.startsWith('//')) src = 'https:' + src;
            if (src.startsWith('/')) src = new URL(url).origin + src;
            images.push(src);
          }
        });
      }
      if (rule.sizes_selector) {
        const dSizes: string[] = [];
        $(rule.sizes_selector).each((_, el) => {
          const sz = $(el).text().trim();
          if (sz && !dSizes.includes(sz)) dSizes.push(sz);
        });
        if (dSizes.length > 0) { sizes.length = 0; sizes.push(...dSizes); }
      }
    } catch (e) { console.error('Error applying scraping rule:', e); }
  }

  // Fallback to basic JSON-LD
  if (!title || !price) {
    const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const block of jsonLdBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : data['@type'] === 'Product' ? data : null;
        if (product) {
          title = title || product.name || '';
          description = description || product.description || '';
          price = price || parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || 0;
        }
      } catch (_e) {
        // ignore malformed JSON-LD blocks
      }
    }
  }

  // Fallback OG tags
  title = title || html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  description = description || html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

  if (!price) {
    const m = html.match(/(\d{2,6})\s*(?:ر\.ي|ريال|YER|SAR)/i);
    if (m) price = parseFloat(m[1]);
  }

  // Fallback Images
  if (images.length === 0) {
    const seen = new Set<string>();
    const addImg = (u: string) => {
      if (!u || seen.has(u)) return;
      u = u.replace(/&amp;/g, '&');
      if (u.startsWith('//')) u = 'https:' + u;
      if (!u.startsWith('http') || /favicon|logo|icon|sprite|placeholder|1x1/i.test(u)) return;
      seen.add(u); images.push(u);
    };
    [...html.matchAll(/property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/gi)].forEach(m => addImg(m[1]));
    [...html.matchAll(/data-(?:src|image|zoom|large)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/gi)].forEach(m => addImg(m[1]));
    [...html.matchAll(/["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/gi)].forEach(m => { if (images.length < 15) addImg(m[1]); });
  }

  return {
    title: title.trim(), description: description.trim(), price,
    currency: 'YER', images: images.slice(0, 12), sizes,
    colors: [{ name: 'متعدد الألوان', hex: '#888888' }], sourceUrl: url,
    usedRule, // Add internal flag
  } as any;
}


// Markdown helpers
function extractFromMd(md: string, type: string): any {
  if (type === 'title') return (md.match(/^#\s+(.+)/m)?.[1] || md.match(/^##\s+(.+)/m)?.[1] || '').trim();
  if (type === 'desc') return md.split('\n\n').filter(p => !p.startsWith('#') && p.length > 40).slice(0, 3).join('\n\n').trim();
  if (type === 'price') { const m = md.match(/(\d[\d,.]+)\s*(?:ريال|YER|SAR|USD|\$|﷼)/i); return m ? parseFloat(m[1].replace(/,/g, '')) : 0; }
  if (type === 'images') return [...md.matchAll(/!\[.*?\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/gi)].map(m => m[1]);
  return '';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  corsHeaders(res);

  const { allowed, remaining } = rateLimit(req);
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  if (!allowed) return res.status(429).json({ success: false, error: 'تم تجاوز الحد المسموح من الطلبات.' });

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') return res.status(400).json({ success: false, error: 'URL is required' });

  const result: ImportResult = {
    success: false, strategy: 'failed',
    attempts: { shein: false, direct: false, firecrawl: false, jina: false },
  };

  let data: ImportResult['data'] | null = null;

  // 0. Shein specialized
  if (url.includes('shein.com')) {
    result.attempts.shein = true;
    const html = await tryDirectFetch(url);
    if (html) {
      const shein = await scrapeSheinProduct(html, url);
      if (shein) {
        data = { title: shein.name, description: shein.description, price: shein.price, currency: shein.currency, images: shein.images, sizes: shein.sizes, colors: shein.colors, sourceUrl: url };
        result.strategy = 'shein';
      }
    }
  }

  // 1. Direct fetch (server-side - no CORS!)
  if (!data) {
    result.attempts.direct = true;
    const rule = await getScrapingRule(url);
    const html = await tryDirectFetch(url);
    if (html) {
      const parsed = parseHtml(html, url, rule);
      if (parsed.title || parsed.images.length > 0) {
        data = parsed;
        result.strategy = (parsed as any).usedRule ? 'mapped_rules' : 'direct';
      }
    }
  }

  // 2. Firecrawl (for JS-heavy sites)
  if (!data) {
    result.attempts.firecrawl = true;
    data = await tryFirecrawl(url);
    if (data) result.strategy = 'firecrawl';
  }

  // 3. Jina.ai
  if (!data) {
    result.attempts.jina = true;
    const md = await tryJina(url);
    if (md) {
      data = {
        title: extractFromMd(md, 'title'), description: extractFromMd(md, 'desc'),
        price: extractFromMd(md, 'price'), currency: 'YER',
        images: extractFromMd(md, 'images').slice(0, 12), sizes: ['S', 'M', 'L', 'XL'],
        colors: [{ name: 'متعدد الألوان', hex: '#888888' }], sourceUrl: url,
      };
      result.strategy = 'jina';
    }
  }

  if (!data) {
    return res.status(200).json({ ...result, error: 'فشل استيراد المنتج. يرجى التحقق من الرابط.' });
  }

  result.success = true;
  result.data = data;
  return res.status(200).json(result);
}
