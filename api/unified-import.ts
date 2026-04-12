import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit, corsHeaders, handleOptions } from './_middleware';

// ─── Configuration ────────────────────────────────────────────────────────────
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

interface ImportResult {
  success: boolean;
  strategy: 'firecrawl' | 'jina' | 'proxy' | 'failed';
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
  attempts: {
    firecrawl: boolean;
    jina: boolean;
    proxy: boolean;
  };
}

// ─── Helper: Fetch with timeout ───────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── LAYER 1: Firecrawl API (Best Quality) ───────────────────────────────────
async function tryFirecrawl(url: string): Promise<ImportResult['data'] | null> {
  if (!FIRECRAWL_API_KEY) {
    console.log('[Firecrawl] No API key, skipping');
    return null;
  }

  try {
    console.log('[Firecrawl] Attempting...');
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
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                currency: { type: 'string' },
                images: { type: 'array', items: { type: 'string' } },
                sizes: { type: 'array', items: { type: 'string' } },
                colors: { type: 'array', items: { type: 'object' } },
              },
            },
          },
          onlyMainContent: false,
          waitFor: 2000,
        }),
      },
      25000
    );

    if (!res.ok) {
      console.log(`[Firecrawl] HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (!json.success) {
      console.log('[Firecrawl] API returned success=false');
      return null;
    }

    const extracted = json.data?.extract;
    const markdown = json.data?.markdown || '';

    const result = {
      title: extracted?.name || extractTitleFromMarkdown(markdown),
      description: extracted?.description || extractDescFromMarkdown(markdown),
      price: extracted?.price || extractPriceFromMarkdown(markdown),
      currency: extracted?.currency || 'YER',
      images: (extracted?.images?.length ? extracted.images : extractImagesFromMarkdown(markdown)).slice(0, 12),
      sizes: extracted?.sizes?.length ? extracted.sizes : extractSizesFromMarkdown(markdown),
      colors: extracted?.colors?.length ? extracted.colors : [{ name: 'متعدد الألوان', hex: '#888888' }],
      sourceUrl: url,
    };

    if (result.title && result.images.length > 0) {
      console.log('[Firecrawl] ✅ Success');
      return result;
    }

    return null;
  } catch (err: any) {
    console.log('[Firecrawl] Error:', err.message);
    return null;
  }
}

// ─── LAYER 2: Jina.ai Reader ──────────────────────────────────────────────────
async function tryJina(url: string): Promise<ImportResult['data'] | null> {
  try {
    console.log('[Jina.ai] Attempting...');
    const res = await fetchWithTimeout(`https://r.jina.ai/${url}`, {}, 18000);
    if (!res.ok) return null;

    const markdown = await res.text();
    if (markdown.length < 300) return null;

    const result = {
      title: extractTitleFromMarkdown(markdown),
      description: extractDescFromMarkdown(markdown),
      price: extractPriceFromMarkdown(markdown),
      currency: 'YER',
      images: extractImagesFromMarkdown(markdown).slice(0, 12),
      sizes: extractSizesFromMarkdown(markdown),
      colors: [{ name: 'متعدد الألوان', hex: '#888888' }],
      sourceUrl: url,
    };

    if (result.title && result.images.length > 0) {
      console.log('[Jina.ai] ✅ Success');
      return result;
    }

    return null;
  } catch (err) {
    console.log('[Jina.ai] Error');
    return null;
  }
}

// ─── LAYER 3: CORS Proxies ────────────────────────────────────────────────────
const CORS_PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

async function tryProxy(url: string): Promise<ImportResult['data'] | null> {
  for (const makeUrl of CORS_PROXIES) {
    try {
      console.log('[Proxy] Attempting...');
      const res = await fetchWithTimeout(makeUrl(url), {}, 12000);
      if (!res.ok) continue;

      const html = await res.text();
      if (html.length < 500) continue;

      const result = parseHtml(html, url);
      if (result.title && result.images.length > 0) {
        console.log('[Proxy] ✅ Success');
        return result;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ─── HTML Parser ──────────────────────────────────────────────────────────────
function parseHtml(html: string, url: string): ImportResult['data'] {
  let title = '', description = '', price = 0;

  // Extract from JSON-LD
  const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : data['@type'] === 'Product' ? data : null;
      if (product) {
        title = title || product.name || '';
        description = description || product.description || '';
        price = price || parseFloat(product.offers?.price || '0') || 0;
      }
    } catch {}
  }

  title = title || html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] || html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  description = description || html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

  if (!price) {
    const priceMatch = html.match(/(\d{2,6})\s*(?:ر\.ي|ريال|YER|SAR)/i);
    if (priceMatch) price = parseFloat(priceMatch[1]);
  }

  return {
    title: title.trim(),
    description: description.trim(),
    price,
    currency: 'YER',
    images: extractImagesFromHtml(html),
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'متعدد الألوان', hex: '#888888' }],
    sourceUrl: url,
  };
}

// ─── Markdown Helpers ─────────────────────────────────────────────────────────
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
  const m = md.match(/(\d[\d,\.]+)\s*(?:ريال|YER|SAR|USD|\$|﷼)/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return 0;
}

function extractImagesFromMarkdown(md: string): string[] {
  const matches = [...md.matchAll(/!\[.*?\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/gi)];
  return [...new Set(matches.map(m => m[1]))];
}

function extractSizesFromMarkdown(md: string): string[] {
  const sizeBlock = md.match(/(?:sizes?|مقاسات?).*?:[^\n]*((?:[SMLXsx\d,\s/|-]+)+)/i);
  if (sizeBlock) {
    const raw = sizeBlock[1].split(/[,/|]/).map(s => s.trim().toUpperCase()).filter(s => s.length < 8 && s.length > 0);
    if (raw.length > 0) return raw;
  }
  return ['S', 'M', 'L', 'XL'];
}

function extractImagesFromHtml(html: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (u: string) => {
    if (!u || seen.has(u)) return;
    u = u.replace(/&amp;/g, '&');
    if (u.startsWith('//')) u = 'https:' + u;
    if (!u.startsWith('http')) return;
    if (/favicon|logo|icon|sprite|placeholder|loading/.test(u)) return;
    seen.add(u);
    images.push(u);
  };

  [...html.matchAll(/property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/gi)].forEach(m => addImage(m[1]));
  [...html.matchAll(/data-(?:src|image|zoom|large)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/gi)].forEach(m => addImage(m[1]));
  [...html.matchAll(/["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/gi)].forEach(m => { if (images.length < 15) addImage(m[1]); });

  return images.slice(0, 12);
}

// ─── Smart Categorization with Gemini ─────────────────────────────────────────
async function suggestCategory(title: string, description: string): Promise<string | undefined> {
  if (!GEMINI_API_KEY) return undefined;

  try {
    const prompt = `بناءً على اسم المنتج والوصف التالي، اقترح فئة واحدة فقط من القائمة التالية:
- ملابس نسائية
- ملابس رجالية
- أحذية
- إكسسوارات
- حقائب
- عطور

اسم المنتج: ${title}
الوصف: ${description.substring(0, 200)}

أجب بكلمة واحدة فقط (الفئة):`;

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
      10000
    );

    if (!res.ok) return undefined;

    const json = await res.json();
    const category = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return category || undefined;
  } catch {
    return undefined;
  }
}

// ─── Main Handler with Waterfall Logic ────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  corsHeaders(res);

  const { allowed, remaining } = rateLimit(req);
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد دقيقة.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  const result: ImportResult = {
    success: false,
    strategy: 'failed',
    attempts: {
      firecrawl: false,
      jina: false,
      proxy: false,
    },
  };

  // WATERFALL LOGIC: Try each method in order
  let data: ImportResult['data'] | null = null;

  // Layer 1: Firecrawl
  result.attempts.firecrawl = true;
  data = await tryFirecrawl(url);
  if (data) {
    result.strategy = 'firecrawl';
    result.success = true;
    result.data = data;
  }

  // Layer 2: Jina.ai (if Firecrawl failed)
  if (!data) {
    result.attempts.jina = true;
    data = await tryJina(url);
    if (data) {
      result.strategy = 'jina';
      result.success = true;
      result.data = data;
    }
  }

  // Layer 3: Proxy (if both failed)
  if (!data) {
    result.attempts.proxy = true;
    data = await tryProxy(url);
    if (data) {
      result.strategy = 'proxy';
      result.success = true;
      result.data = data;
    }
  }

  // If all failed
  if (!data) {
    return res.status(200).json({
      ...result,
      error: 'فشل استيراد المنتج من جميع المصادر. يرجى التحقق من الرابط والمحاولة مرة أخرى.',
    });
  }

  // Smart Categorization
  if (data.title && data.description) {
    data.suggestedCategory = await suggestCategory(data.title, data.description);
  }

  return res.status(200).json(result);
}
