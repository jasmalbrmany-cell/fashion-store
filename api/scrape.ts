import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit, corsHeaders, handleOptions } from './_middleware';
import { scrapeSheinProduct } from './_lib/shein';

// ─── Site Configs ─────────────────────────────────────────────────────────────
const SITE_CONFIGS: Record<string, { currency: string; baseCategory: string }> = {
  'pletino.com':  { currency: 'SAR', baseCategory: 'ملابس أطفال' },
  'zahraah.com':  { currency: 'YER', baseCategory: '' },
  'shein.com':    { currency: 'USD', baseCategory: '' },
  'noon.com':     { currency: 'SAR', baseCategory: '' },
  'amazon.com':   { currency: 'USD', baseCategory: '' },
  'amazon.sa':    { currency: 'SAR', baseCategory: '' },
  'namshi.com':   { currency: 'SAR', baseCategory: '' },
  'aliexpress.com': { currency: 'USD', baseCategory: '' },
};

function getSiteConfig(url: string) {
  for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
    if (url.includes(domain)) return { domain, ...config };
  }
  return { domain: 'unknown', currency: 'YER', baseCategory: '' };
}

// ─── User Agents (rotate to avoid blocking) ──────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── LAYER 1: Firecrawl API ───────────────────────────────────────────────────
async function scrapeWithFirecrawl(url: string): Promise<any | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.warn('[Firecrawl] No API key found, skipping.');
    return null;
  }

  try {
    const res = await fetchWithTimeout(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                name:        { type: 'string', description: 'Product name or title' },
                description: { type: 'string', description: 'Full product description' },
                price:       { type: 'number', description: 'Numeric price without currency symbol' },
                currency:    { type: 'string', description: 'Currency code e.g. YER, SAR, USD' },
                images:      { type: 'array',  items: { type: 'string' }, description: 'All product image URLs' },
                sizes:       { type: 'array',  items: { type: 'string' }, description: 'Available sizes' },
                colors:      { type: 'array',  items: { type: 'object', properties: { name: { type: 'string' }, hex: { type: 'string' } } }, description: 'Available colors with hex codes' },
              },
            },
          },
          onlyMainContent: false,
          waitFor: 2000,
        }),
      },
      6000
    );

    if (!res.ok) {
      console.warn(`[Firecrawl] HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (!json.success) {
      console.warn('[Firecrawl] API returned success=false:', json.error);
      return null;
    }

    const extracted = json.data?.extract;
    const markdown  = json.data?.markdown || '';

    const result = {
      title:       extracted?.name        || extractTitleFromMarkdown(markdown),
      description: extracted?.description || extractDescFromMarkdown(markdown),
      price:       extracted?.price       || extractPriceFromMarkdown(markdown),
      currency:    extracted?.currency    || 'YER',
      images:      (extracted?.images?.length ? extracted.images : extractImagesFromMarkdown(markdown)).slice(0, 12),
      sizes:       extracted?.sizes?.length
                     ? extracted.sizes
                     : extractSizesFromMarkdown(markdown),
      colors:      extracted?.colors?.length
                     ? extracted.colors
                     : [{ name: 'متعدد الألوان', hex: '#888888' }],
      source: 'firecrawl',
    };

    console.log(`[Firecrawl] ✓ title="${result.title}" images=${result.images.length} price=${result.price}`);
    return result;

  } catch (err: any) {
    console.warn('[Firecrawl] Error:', err.message);
    return null;
  }
}

// ─── LAYER 2: Direct Fetch (Server-side - no CORS needed!) ────────────────────
async function scrapeDirectFetch(url: string): Promise<string | null> {
  try {
    console.log('[Direct] Fetching:', url);
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      redirect: 'follow',
    }, 4000);

    if (!res.ok) {
      console.warn(`[Direct] HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();
    if (html.length > 500) {
      console.log(`[Direct] ✓ Got ${html.length} chars`);
      return html;
    }
    return null;
  } catch (err: any) {
    console.warn('[Direct] Error:', err.message);
    return null;
  }
}

// ─── LAYER 3: Jina.ai Reader ──────────────────────────────────────────────────
async function scrapeWithJina(url: string): Promise<string | null> {
  try {
    console.log('[Jina] Fetching...');
    const res = await fetchWithTimeout(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
      },
    }, 5000);
    if (!res.ok) return null;
    const text = await res.text();
    return text.length > 300 ? text : null;
  } catch {
    return null;
  }
}

// ─── LAYER 4: Backup Proxies (last resort) ────────────────────────────────────
const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

async function scrapeWithProxy(url: string): Promise<string | null> {
  for (const makeUrl of CORS_PROXIES) {
    try {
      const res = await fetchWithTimeout(makeUrl(url), {
        headers: { 'User-Agent': randomUA() },
      }, 4000);
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length > 500) return text;
    } catch { /* next */ }
  }
  return null;
}

// ─── HTML Parsers ─────────────────────────────────────────────────────────────
function extractImages(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (u: string) => {
    if (!u || seen.has(u)) return;
    u = u.replace(/&amp;/g, '&');
    if (u.startsWith('//')) u = 'https:' + u;
    if (!u.startsWith('http')) return;
    if (/favicon|logo|icon|sprite|placeholder|loading|pixel|tracking|1x1/i.test(u)) return;
    if (/50x50|32x32|16x16|1x1/i.test(u)) return;
    seen.add(u); images.push(u);
  };

  // JSON-LD structured data (highest quality)
  const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data)
        ? data.find((d: any) => d['@type'] === 'Product')
        : data['@type'] === 'Product' ? data : null;
      if (product?.image) {
        (Array.isArray(product.image) ? product.image : [product.image]).forEach(addImage);
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }

  // Open Graph images
  [...html.matchAll(/property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/gi)].forEach(m => addImage(m[1]));
  [...html.matchAll(/content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/gi)].forEach(m => addImage(m[1]));

  // Data attributes (common in e-commerce)
  [...html.matchAll(/data-(?:src|image|zoom|large|original|full|big)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/gi)].forEach(m => addImage(m[1]));

  // Cloudinary / CDN images
  [...html.matchAll(/(https:\/\/pub-[a-z0-9]+\.r2\.dev\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/gi)].forEach(m => addImage(m[1]));
  [...html.matchAll(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)[^\s"'<>]*)/gi)].forEach(m => addImage(m[1]));

  // General image URLs
  [...html.matchAll(/["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/gi)].forEach(m => { if (images.length < 15) addImage(m[1]); });

  return images.slice(0, 12);
}

function extractSizes(html: string, isPletino = false): string[] {
  if (isPletino) return extractPletinoSizes(html);
  const sizes: string[] = [];
  const seen = new Set<string>();
  const addSize = (s: string) => {
    s = s.trim().toUpperCase();
    if (!s || seen.has(s) || s.length > 10) return;
    seen.add(s); sizes.push(s);
  };

  // Standard sizes
  const stdSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL'];
  stdSizes.forEach(s => { if (new RegExp(`["'>]${s}["'<]`, 'g').test(html)) addSize(s); });

  // Numeric sizes
  for (let n = 34; n <= 48; n += 2) {
    if (html.includes(`>${n}<`) || html.includes(`"${n}"`)) addSize(n.toString());
  }

  return sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'];
}

function extractPletinoSizes(html: string): string[] {
  const sizes: string[] = [];
  const seen = new Set<string>();
  const pats = [/(\d{1,2}[-–]\d{1,2}\s*(?:سنوات?|أشهر|شهر|سنة))/g, /(\d{1,2}[-–]\d{1,2}\s*(?:years?|months?))/gi, /حديث الولادة/g, /مواليد/g];
  for (const pat of pats) { for (const m of html.matchAll(pat)) { const s = m[1] || m[0]; if (s && !seen.has(s)) { seen.add(s); sizes.push(s); } } }
  ['XS','S','M','L','XL','XXL','2XL','3XL'].forEach(s => { if (new RegExp(`"${s}"|'${s}'|>${s}<`).test(html) && !seen.has(s)) { seen.add(s); sizes.push(s); } });
  return sizes.length > 0 ? sizes : ['حسب الطلب'];
}

const COLOR_MAP: Record<string, string> = {
  'أسود': '#1a1a1a', 'black': '#1a1a1a', 'أبيض': '#ffffff', 'white': '#ffffff',
  'أحمر': '#dc2626', 'red': '#dc2626', 'أزرق': '#2563eb', 'blue': '#2563eb',
  'أخضر': '#16a34a', 'green': '#16a34a', 'بيج': '#d4a574', 'beige': '#d4a574',
  'رمادي': '#6b7280', 'gray': '#6b7280', 'grey': '#6b7280', 'زهري': '#ec4899', 'pink': '#ec4899',
  'بني': '#92400e', 'brown': '#92400e', 'برتقالي': '#ea580c', 'orange': '#ea580c',
  'أصفر': '#eab308', 'yellow': '#eab308', 'بنفسجي': '#7c3aed', 'purple': '#7c3aed',
  'كحلي': '#1e3a5f', 'navy': '#1e3a5f', 'عنابي': '#7f1d1d', 'maroon': '#7f1d1d',
  'ذهبي': '#d4af37', 'gold': '#d4af37', 'فضي': '#c0c0c0', 'silver': '#c0c0c0',
};

function extractColors(html: string): { name: string; hex: string }[] {
  const colors: { name: string; hex: string }[] = [];
  const seen = new Set<string>();

  // Try to find hex colors from swatches
  const hexMatches = [...html.matchAll(/background(?:-color)?:\s*#([0-9a-fA-F]{6})/gi)];
  for (const m of hexMatches) {
    const hex = '#' + m[1].toLowerCase();
    if (!seen.has(hex) && colors.length < 8) {
      seen.add(hex);
      colors.push({ name: hex, hex });
    }
  }

  // Named colors
  for (const [name, hex] of Object.entries(COLOR_MAP)) {
    if (new RegExp(name, 'i').test(html) && !seen.has(name)) {
      seen.add(name); colors.push({ name, hex });
      if (colors.length >= 8) break;
    }
  }

  return colors.length > 0 ? colors : [{ name: 'متعدد الألوان', hex: '#888888' }];
}

function parseHtml(html: string, url: string, currency = 'YER') {
  const isPletino = url.includes('pletino.com');
  let title = '', description = '', price = 0;

  // 1. JSON-LD (best quality)
  const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data)
        ? data.find((d: any) => d['@type'] === 'Product')
        : data['@type'] === 'Product' ? data : null;
      if (product) {
        title       = title       || product.name || '';
        description = description || product.description || '';
        price       = price       || parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || 0;
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }

  // 2. Open Graph / Meta tags
  title       = title       || html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]       || html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  description = description || html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  title = title.replace(/^بلاتينو\s*[-–]\s*/u, '').trim();

  // 3. Price extraction
  if (!price) {
    const pricePatterns = [
      /["']price["']\s*:\s*["']?(\d+[.,]?\d*)["']?/i,
      /(\d{2,6})\s*(?:ر\.ي|ريال|YER|SAR)/i,
      /class=["'][^"']*price[^"']*["'][^>]*>[\s]*(?:<[^>]+>)*[\s]*(\d[\d,.]+)/gi,
      /(\d[\d,.]+)\s*(?:ر\.ي|ريال|YER|SAR|\$|USD|€)/i,
    ];
    for (const p of pricePatterns) { const m = html.match(p); if (m) { price = parseFloat(m[1].replace(',', '.')); if (price > 0) break; } }
  }

  return { title, description, price, images: extractImages(html), sizes: extractSizes(html, isPletino), colors: extractColors(html), currency, source: 'html-parse' };
}

// Markdown helpers
function extractTitleFromMarkdown(md: string): string {
  const h1 = md.match(/^#\s+(.+)/m)?.[1];
  const h2 = md.match(/^##\s+(.+)/m)?.[1];
  return (h1 || h2 || '').trim();
}

function extractDescFromMarkdown(md: string): string {
  const paras = md.split('\n\n').filter(p => !p.startsWith('#') && p.length > 40).slice(0, 3);
  return paras.join('\n\n').trim();
}

function extractPriceFromMarkdown(md: string): number {
  const m = md.match(/(\d[\d,.]+)\s*(?:ريال|YER|SAR|USD|\$|﷼)/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return 0;
}

function extractImagesFromMarkdown(md: string): string[] {
  const matches = [...md.matchAll(/!\[.*?\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/gi)];
  return [...new Set(matches.map(m => m[1]))].filter(url => !url.startsWith('blob:'));
}

function extractSizesFromMarkdown(md: string): string[] {
  const sizeBlock = md.match(/(?:sizes?|مقاسات?).*?:[^\n]*((?:[SMLXsx\d,\s/|-]+)+)/i);
  if (sizeBlock) {
    const raw = sizeBlock[1].split(/[,/|]/).map(s => s.trim().toUpperCase()).filter(s => s.length < 8 && s.length > 0);
    if (raw.length > 0) return raw;
  }
  return ['S', 'M', 'L', 'XL'];
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  corsHeaders(res);

  const { allowed, remaining } = rateLimit(req);
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  
  if (!allowed) {
    return res.status(429).json({ 
      success: false, 
      error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.',
      retryAfter: 60 
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') return res.status(400).json({ success: false, error: 'URL is required' });

  const siteConfig = getSiteConfig(url);
  let result: any = null;
  let usedStrategy = '';

  // ── Strategy 0: Specialized Shein Scraper ──
  if (url.includes('shein.com')) {
    console.log('[Scrape] Trying Shein Specialized...');
    try {
      const html = await scrapeDirectFetch(url);
      if (html) {
        const sheinData = await scrapeSheinProduct(html, url);
        if (sheinData) {
          result = {
            title: sheinData.name,
            description: sheinData.description,
            price: sheinData.price,
            currency: sheinData.currency,
            images: sheinData.images,
            sizes: sheinData.sizes,
            colors: sheinData.colors,
            source: 'shein-specialized',
          };
          usedStrategy = 'shein-specialized';
        }
      }
    } catch (e) {
      console.warn('[Shein] Error:', e);
    }
  }

  // ── Strategy 1: Direct fetch + HTML parse (Server-side - NO CORS!) ──
  if (!result) {
    console.log('[Scrape] Trying Direct Fetch...');
    const html = await scrapeDirectFetch(url);
    if (html) {
      result = parseHtml(html, url, siteConfig.currency);
      const hasMeaningfulData = result.price > 0 || (result.images && result.images.length > 0);
      if (hasMeaningfulData) {
        usedStrategy = 'direct-fetch';
      } else {
        result = null;
      }
    }
  }

  // ── Strategy 2: Firecrawl (best quality for JS-heavy sites) ──
  if (!result) {
    console.log('[Scrape] Trying Firecrawl...');
    result = await scrapeWithFirecrawl(url);
    if (result) {
      usedStrategy = 'firecrawl';
    }
  }

  // ── Strategy 3: Jina.ai reader (markdown rendering) ──
  if (!result || (!result.title && result.images?.length === 0)) {
    console.log('[Scrape] Trying Jina.ai...');
    const md = await scrapeWithJina(url);
    if (md) {
      result = {
        title:       extractTitleFromMarkdown(md),
        description: extractDescFromMarkdown(md),
        price:       extractPriceFromMarkdown(md),
        currency:    siteConfig.currency,
        images:      extractImagesFromMarkdown(md).slice(0, 12),
        sizes:       extractSizesFromMarkdown(md),
        colors:      [{ name: 'متعدد الألوان', hex: '#888888' }],
        source:      'jina',
      };
      usedStrategy = 'jina';
    }
  }

  // ── Strategy 4: CORS Proxy (last resort) ──
  if (!result || (!result.title && result.images?.length === 0)) {
    console.log('[Scrape] Trying CORS proxy...');
    const html = await scrapeWithProxy(url);
    if (html) {
      result = parseHtml(html, url, siteConfig.currency);
      usedStrategy = 'html-proxy';
    }
  }

  // ── Fallback: empty scaffold ──
  if (!result) {
    result = { title: '', description: '', price: 0, currency: siteConfig.currency, images: [], sizes: ['S', 'M', 'L', 'XL'], colors: [{ name: 'متعدد الألوان', hex: '#888888' }], source: 'manual' };
    usedStrategy = 'manual';
  }

  // Override currency from site config if not set by scraper
  if (!result.currency || result.currency === 'YER') {
    result.currency = siteConfig.currency;
  }

  const hasUsefulData = !!(result.title || (result.images && result.images.length > 0));

  return res.status(200).json({
    success: hasUsefulData,
    partial: !result.title || !result.images?.length,
    strategy: usedStrategy,
    sourceSite: siteConfig.domain,
    suggestedCategory: siteConfig.baseCategory,
    data: result,
  });
}
