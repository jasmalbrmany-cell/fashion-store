import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit, corsHeaders, handleOptions } from './_middleware';
import { scrapeSheinCategory, scrapeSheinProduct } from './_lib/shein';
import { supabase } from './_lib/supabase';

// ─── User Agents ──────────────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchJSON(url: string, timeout = 8000, extraHeaders: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'application/json',
        ...extraHeaders,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Direct fetch - we're on Vercel server-side, NO CORS needed!
async function fetchHTML(url: string, timeout = 12000): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text && text.length > 500) return text;
    throw new Error('Response too short');
  } catch (err) {
    clearTimeout(t);
    return fetchHTMLViaProxy(url, timeout);
  }
}

// Proxy fallback for sites that block direct server requests
async function fetchHTMLViaProxy(url: string, timeout = 10000): Promise<string> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for (const proxy of proxies) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(proxy, {
        signal: controller.signal,
        headers: { 'User-Agent': randomUA() },
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.length > 1000) return text;
    } catch { /* next */ } finally { clearTimeout(t); }
  }
  throw new Error('All fetch methods failed');
}

// ─── Store Credentials ────────────────────────────────────────────────────────
async function getStoreCredentials(url: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const result = await Promise.race([
      supabase
        .from('external_stores')
        .select('username, password')
        .ilike('url', `%${domain}%`)
        .limit(1)
        .single()
        .catch(() => ({ data: null })),
      new Promise<{data: null}>((resolve) => setTimeout(() => resolve({data: null}), 3000))
    ]);
    return (result as any)?.data || null;
  } catch {
    return null;
  }
}

// ============================================================
// STRATEGY 1: WooCommerce Store API (public, no auth needed)
// ============================================================
async function tryWooCommerceAPI(baseUrl: string, page = 1, perPage = 24): Promise<any[]> {
  const base = baseUrl.replace(/\/$/, '');
  const apiUrl = `${base}/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}&_fields=id,name,description,short_description,prices,images,categories,attributes,variations,average_rating,variation_ids,permalink`;

  const creds = await getStoreCredentials(baseUrl);
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  
  if (creds?.username && creds?.password) {
    const auth = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl, {
      headers: { ...headers, 'User-Agent': randomUA() },
      signal: controller.signal,
    });
    clearTimeout(t);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

// ============================================================
// STRATEGY 2: WooCommerce REST API v3
// ============================================================
async function tryWooCommerceV3(baseUrl: string, page = 1): Promise<any[]> {
  const base = baseUrl.replace(/\/$/, '');
  
  const creds = await getStoreCredentials(baseUrl);
  let apiUrl = `${base}/wp-json/wc/v3/products?per_page=20&page=${page}&status=publish`;
  
  if (creds?.username && creds?.password) {
    apiUrl += `&consumer_key=${creds.username}&consumer_secret=${creds.password}`;
  }

  try {
    const data = await fetchJSON(apiUrl);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

// ============================================================
// STRATEGY 3: Shopify API (public)
// ============================================================
async function tryShopifyAPI(baseUrl: string, page = 1): Promise<any[]> {
  const base = baseUrl.replace(/\/$/, '');
  const apiUrl = `${base}/products.json?limit=20&page=${page}`;
  try {
    const data = await fetchJSON(apiUrl);
    if (data?.products && Array.isArray(data.products)) return data.products;
    return [];
  } catch {
    return [];
  }
}

// ============================================================
// STRATEGY 4: HTML Scrape product listing page (direct fetch)
// ============================================================
async function scrapeProductLinks(listingUrl: string): Promise<{ href: string; name: string; image: string; price: number }[]> {
  try {
    const html = await fetchHTML(listingUrl);
    const results: { href: string; name: string; image: string; price: number }[] = [];
    const seen = new Set<string>();
    const base = new URL(listingUrl).origin;

    // Method 1: JSON-LD structured data (most reliable)
    const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const block of jsonLdBlocks) {
      try {
        const data = JSON.parse(block[1]);
        const items = data?.itemListElement || data?.mainEntity?.itemListElement || [];
        for (const item of items) {
          const prod = item?.item || item;
          if (prod?.url && prod?.name) {
            let pUrl = prod.url;
            if (pUrl.startsWith('/')) pUrl = base + pUrl;
            if (!seen.has(pUrl)) {
              seen.add(pUrl);
              results.push({
                href: pUrl,
                name: prod.name,
                image: prod.image || '',
                price: parseFloat(prod.offers?.price || '0') || 0,
              });
            }
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    if (results.length > 3) return results.slice(0, 60);

    // Method 2: Product link patterns in HTML
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const matches = html.matchAll(linkPattern);

    for (const m of matches) {
      const innerHtml = m[2];
      let url = m[1];
      if (!url) continue;
      if (url.startsWith('/')) url = base + url;
      if (!url.startsWith('http')) continue;
      const urlL = url.toLowerCase();

      const isProd = urlL.includes('/product/') || urlL.includes('/products/') ||
        urlL.includes('/p-') || urlL.includes('/item/') || urlL.includes('/dp/') ||
        (urlL.includes('-p-') && urlL.endsWith('.html')) ||
        urlL.match(/\/\d{3,}-/);

      if (isProd && !seen.has(url)) {
        seen.add(url);
        const nameMatch = innerHtml.match(/>([^<>]{3,80})</);
        const name = nameMatch?.[1]?.replace(/&[a-z]+;/gi, ' ').trim() || '';
        const imgMatch = innerHtml.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i);
        const image = imgMatch?.[1] || '';
        const priceMatch = innerHtml.match(/(\d[\d,.]+)\s*(?:﷼|ريال|SAR|YER|\$|€)/i);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        if (name && name.length > 2) {
          results.push({ href: url, name, image, price });
        }
      }
      if (results.length >= 60) break;
    }

    // Method 3: Find product cards with class-based extraction
    if (results.length === 0) {
      const cardPatterns = [
        /<[^>]*class=["'][^"']*product[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|li|article)>/gi,
        /<[^>]*class=["'][^"']*card[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|li|article)>/gi,
      ];

      for (const pattern of cardPatterns) {
        for (const card of html.matchAll(pattern)) {
          const cardHtml = card[1];
          const linkM = cardHtml.match(/href=["']([^"']+)["']/);
          const nameM = cardHtml.match(/<(?:h[2-6]|p|span)[^>]*>([^<]{3,80})<\//);
          const imgM  = cardHtml.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i);
          const priceM = cardHtml.match(/(\d[\d,.]+)\s*(?:﷼|ريال|SAR|YER|\$|€)/i);

          if (linkM && nameM) {
            let pUrl = linkM[1];
            if (pUrl.startsWith('/')) pUrl = base + pUrl;
            if (!seen.has(pUrl) && pUrl.startsWith('http')) {
              seen.add(pUrl);
              results.push({
                href: pUrl,
                name: nameM[1].replace(/&[a-z]+;/gi, ' ').trim(),
                image: imgM?.[1] || '',
                price: priceM ? parseFloat(priceM[1].replace(/,/g, '')) : 0,
              });
            }
          }
          if (results.length >= 60) break;
        }
        if (results.length > 0) break;
      }
    }

    return results;
  } catch {
    return [];
  }
}

// ============================================================
// Normalize WooCommerce Store API product
// ============================================================
function normalizeWooStoreProduct(p: any, currency = 'SAR') {
  const images = (p.images || []).map((img: any) => img.src || img.url || '').filter(Boolean);
  const rawPrice = parseFloat(p.prices?.price || p.prices?.sale_price || p.prices?.regular_price || '0') / 100;
  const price = isNaN(rawPrice) ? 0 : rawPrice;

  const sizes: string[] = [];
  const colors: { name: string; hex: string }[] = [];
  for (const attr of (p.attributes || [])) {
    const name = (attr.name || '').toLowerCase();
    const terms = (attr.terms || []).map((t: any) => t.name || t);
    if (name.includes('size') || name.includes('مقاس') || name.includes('حجم')) {
      sizes.push(...terms.filter(Boolean));
    } else if (name.includes('color') || name.includes('لون')) {
      for (const term of terms) {
        colors.push({ name: term, hex: '#888888' });
      }
    }
  }

  const rawDesc = p.short_description || p.description || '';
  const description = rawDesc.replace(/<[^>]+>/g, '').trim() || 'منتج مستورد';

  return {
    id: p.id?.toString() || Math.random().toString(36).substr(2, 9),
    name: p.name || '',
    description,
    price,
    currency,
    images,
    sizes: sizes.length > 0 ? sizes : ['حسب الطلب'],
    colors: colors.length > 0 ? colors : [{ name: 'متعدد', hex: '#888888' }],
    sourceUrl: p.permalink || '',
    category: (p.categories || [])[0]?.name || '',
  };
}

// ============================================================
// Normalize WooCommerce V3 product
// ============================================================
function normalizeWooV3Product(p: any, currency = 'SAR') {
  const images = (p.images || []).map((img: any) => img.src || '').filter(Boolean);
  const price = parseFloat(p.price || p.sale_price || p.regular_price || '0') || 0;

  const sizes: string[] = [];
  const colors: { name: string; hex: string }[] = [];
  for (const attr of (p.attributes || [])) {
    const name = (attr.name || '').toLowerCase();
    const options = attr.options || [];
    if (name.includes('size') || name.includes('مقاس') || name.includes('حجم')) {
      sizes.push(...options);
    } else if (name.includes('color') || name.includes('لون')) {
      for (const opt of options) {
        colors.push({ name: opt, hex: '#888888' });
      }
    }
  }

  const rawDesc = p.short_description || p.description || '';
  const description = rawDesc.replace(/<[^>]+>/g, '').trim() || 'منتج مستورد';

  return {
    id: p.id?.toString() || Math.random().toString(36).substr(2, 9),
    name: p.name || '',
    description,
    price,
    currency,
    images,
    sizes: sizes.length > 0 ? sizes : ['حسب الطلب'],
    colors: colors.length > 0 ? colors : [{ name: 'متعدد', hex: '#888888' }],
    sourceUrl: p.permalink || '',
    category: (p.categories || [])[0]?.name || '',
  };
}

// ============================================================
// Normalize Shopify product
// ============================================================
function normalizeShopifyProduct(p: any) {
  const images = (p.images || []).map((img: any) => img.src || '').filter(Boolean);
  const price = parseFloat(p.variants?.[0]?.price || '0');
  const sizes: string[] = p.variants?.map((v: any) => v.option1 || v.title).filter(Boolean) || [];
  const description = p.body_html?.replace(/<[^>]+>/g, '').trim() || '';

  return {
    id: p.id?.toString(),
    name: p.title || '',
    description,
    price,
    currency: 'USD',
    images,
    sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'متعدد', hex: '#888888' }],
    sourceUrl: p.handle ? '' : '',
    category: p.product_type || '',
  };
}

// ─── Detect site currency ─────────────────────────────────────────────────────
function detectCurrency(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('.sa') || u.includes('saudi') || u.includes('pletino')) return 'SAR';
  if (u.includes('shein.com')) return 'USD';
  if (u.includes('.ye') || u.includes('yemen')) return 'YER';
  if (u.includes('.ae') || u.includes('emirates')) return 'AED';
  if (u.includes('.eg') || u.includes('egypt')) return 'EGP';
  return 'SAR';
}

// ============================================================
// Main Handler
// ============================================================
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

  const { url, page = 1 } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

  const baseUrl = url.replace(/\/shop\/?$/, '').replace(/\/products?\/?$/, '').replace(/\/$/, '');
  const urlL = url.toLowerCase();
  const currency = detectCurrency(url);

  console.log(`[Catalog] Importing from: ${url} (page=${page}, currency=${currency})`);

  try {
    // ── STRATEGY 0: Specialized Shein Scraper ──
    if (urlL.includes('shein.com') || urlL.includes('shein.')) {
      console.log('[Catalog] Trying Shein engine...');
      try {
        const html = await fetchHTML(url);
        
        let sheinProducts = [];
        if (urlL.includes('-p-') || urlL.includes('.html')) {
          const prod = await scrapeSheinProduct(html, url);
          if (prod) sheinProducts = [prod];
        } else {
          sheinProducts = await scrapeSheinCategory(html, url);
        }

        if (sheinProducts.length > 0) {
          return res.status(200).json({
            success: true,
            strategy: 'shein',
            products: sheinProducts,
            hasMore: false,
            nextPage: 1
          });
        }
      } catch (e) {
        console.warn('[Shein] Error:', e);
      }
    }

    // ── STRATEGY 1: WooCommerce Store API ──
    console.log('[Catalog] Trying WooCommerce Store API...');
    const wooProducts = await tryWooCommerceAPI(baseUrl, page, 24);
    if (wooProducts.length > 0) {
      const products = wooProducts.map(p => normalizeWooStoreProduct(p, currency));
      console.log(`[Catalog] ✓ WooCommerce Store API: ${products.length} products`);
      return res.status(200).json({
        success: true,
        strategy: 'woocommerce',
        products,
        hasMore: products.length >= 24,
        nextPage: page + 1,
      });
    }

    // ── STRATEGY 2: WooCommerce V3 API ──
    console.log('[Catalog] Trying WooCommerce V3...');
    const wooV3 = await tryWooCommerceV3(baseUrl, page);
    if (wooV3.length > 0) {
      const products = wooV3.map(p => normalizeWooV3Product(p, currency));
      console.log(`[Catalog] ✓ WooCommerce V3: ${products.length} products`);
      return res.status(200).json({ success: true, strategy: 'woocommerce_v3', products, hasMore: products.length >= 20, nextPage: page + 1 });
    }

    // ── STRATEGY 3: Shopify ──
    console.log('[Catalog] Trying Shopify...');
    const shopify = await tryShopifyAPI(baseUrl, page);
    if (shopify.length > 0) {
      const products = shopify.map(normalizeShopifyProduct);
      console.log(`[Catalog] ✓ Shopify: ${products.length} products`);
      return res.status(200).json({ success: true, strategy: 'shopify', products, hasMore: products.length >= 20, nextPage: page + 1 });
    }

    // ── STRATEGY 4: HTML scrape listing (direct fetch, no proxy) ──
    console.log('[Catalog] Trying HTML scrape...');
    const urlsToTry = [
      url,
      `${baseUrl}/shop`,
      `${baseUrl}/products`,
      `${baseUrl}/store`,
      baseUrl,
    ];

    for (const tryUrl of urlsToTry) {
      const scraped = await scrapeProductLinks(tryUrl);
      if (scraped.length > 0) {
        const products = scraped.map(p => ({
          id: Math.random().toString(36).substr(2, 9),
          name: p.name,
          description: '',
          price: p.price,
          currency,
          images: p.image ? [p.image] : [],
          sizes: ['حسب الطلب'],
          colors: [{ name: 'متعدد', hex: '#888888' }],
          sourceUrl: p.href,
          category: '',
        }));
        console.log(`[Catalog] ✓ HTML scrape from ${tryUrl}: ${products.length} products`);
        return res.status(200).json({ success: true, strategy: 'scrape', products, hasMore: false, nextPage: 1 });
      }
    }

    console.log('[Catalog] ✗ No products found from any strategy');
    return res.status(200).json({
      success: false,
      strategy: 'none',
      products: [],
      error: 'لم يتمكن النظام من استخراج المنتجات من هذا الموقع. تأكد من الرابط وحاول مرة أخرى، أو استخدم استيراد منتج مفرد.',
    });

  } catch (err: any) {
    console.error('[Catalog] Error:', err.message);
    return res.status(200).json({ 
      success: false, 
      products: [], 
      error: `فشل الاتصال بالموقع: ${err.message}` 
    });
  }
}
