import type { VercelRequest, VercelResponse } from '@vercel/node';

async function fetchJSON(url: string, timeout = 10000): Promise<any> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchHTML(url: string, timeout = 12000): Promise<string> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://r.jina.ai/${url}`,
  ];
  for (const proxy of proxies) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(proxy, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.length > 1000) { clearTimeout(t); return text; }
    } catch { /* next */ } finally { clearTimeout(t); }
  }
  throw new Error('All proxies failed');
}

// ============================================================
// STRATEGY 1: WooCommerce Store API (public, no auth needed)
// Works on: Pletino.com, and most WooCommerce sites
// ============================================================
async function tryWooCommerceAPI(baseUrl: string, page = 1, perPage = 20): Promise<any[]> {
  const base = baseUrl.replace(/\/$/, '');
  const apiUrl = `${base}/wp-json/wc/store/v1/products?per_page=${perPage}&page=${page}&_fields=id,name,description,short_description,prices,images,categories,attributes,variations,average_rating,variation_ids`;

  try {
    const data = await fetchJSON(apiUrl);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

// ============================================================
// STRATEGY 2: WooCommerce REST API (v3, may work without auth on some sites)
// ============================================================
async function tryWooCommerceV3(baseUrl: string, page = 1): Promise<any[]> {
  const base = baseUrl.replace(/\/$/, '');
  const apiUrl = `${base}/wp-json/wc/v3/products?per_page=20&page=${page}&status=publish`;
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
// STRATEGY 4: HTML Scrape product listing page
// ============================================================
async function scrapeProductLinks(listingUrl: string): Promise<{ href: string; name: string; image: string; price: number }[]> {
  try {
    const html = await fetchHTML(listingUrl);
    const results: { href: string; name: string; image: string; price: number }[] = [];
    const seen = new Set<string>();
    const base = new URL(listingUrl).origin;

    // Extract all anchor links that look like product pages
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi;
    const matches = html.matchAll(linkPattern);

    for (const m of matches) {
      let href = m[0];
      let url = m[1];
      if (!url) continue;
      if (url.startsWith('/')) url = base + url;
      if (!url.startsWith('http')) continue;
      const urlL = url.toLowerCase();

      const isProd = urlL.includes('/product/') || urlL.includes('/products/') ||
        urlL.includes('/p-') || urlL.includes('/item/') || urlL.includes('/dp/') ||
        (urlL.includes('-p-') && urlL.endsWith('.html'));

      if (isProd && !seen.has(url)) {
        seen.add(url);
        // Try to extract name from link text
        const nameMatch = href.match(/>([^<>]{3,80})</);
        const name = nameMatch?.[1]?.trim() || '';
        // Try to find image near this link
        const imgMatch = href.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)/i);
        const image = imgMatch?.[1] || '';
        // Try to find price
        const priceMatch = href.match(/(\d[\d,\.]+)\s*(?:﷼|ريال|SAR|YER|\$|€)/i);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

        if (name && name.length > 2) {
          results.push({ href: url, name, image, price });
        }
      }
      if (results.length >= 60) break;
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

  // Extract sizes from attributes
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

  // Get description (remove HTML tags)
  const rawDesc = p.short_description || p.description || '';
  const description = rawDesc.replace(/<[^>]+>/g, '').trim() || 'منتج من بلاتينو';

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
  const mainImage = p.images?.[0]?.src || '';
  const price = parseFloat(p.variants?.[0]?.price || '0');
  const sizes: string[] = p.variants?.map((v: any) => v.option1 || v.title).filter(Boolean) || [];
  const description = p.body_html?.replace(/<[^>]+>/g, '').trim() || '';

  return {
    id: p.id?.toString(),
    name: p.title || '',
    description,
    price,
    currency: 'USD',
    images: [mainImage].filter(Boolean),
    sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
    colors: [{ name: 'متعدد', hex: '#888888' }],
    sourceUrl: '',
    category: p.product_type || '',
  };
}

// ============================================================
// Main Handler
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, page = 1 } = req.body || {};
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });

  const baseUrl = url.replace(/\/shop\/?$/, '').replace(/\/products?\/?$/, '');

  try {
    // ---- STRATEGY 1: WooCommerce Store API ----
    const wooProducts = await tryWooCommerceAPI(baseUrl, page, 24);
    if (wooProducts.length > 0) {
      const products = wooProducts.map(p => normalizeWooStoreProduct(p, 'SAR'));
      return res.status(200).json({
        success: true,
        strategy: 'woocommerce',
        products,
        hasMore: products.length === 24,
        nextPage: page + 1,
      });
    }

    // ---- STRATEGY 2: WooCommerce V3 API ----
    const wooV3 = await tryWooCommerceV3(baseUrl, page);
    if (wooV3.length > 0) {
      const products = wooV3.map(p => normalizeWooStoreProduct(p, 'SAR'));
      return res.status(200).json({ success: true, strategy: 'woocommerce_v3', products, hasMore: products.length === 20, nextPage: page + 1 });
    }

    // ---- STRATEGY 3: Shopify ----
    const shopify = await tryShopifyAPI(baseUrl, page);
    if (shopify.length > 0) {
      const products = shopify.map(normalizeShopifyProduct);
      return res.status(200).json({ success: true, strategy: 'shopify', products, hasMore: products.length === 20, nextPage: page + 1 });
    }

    // ---- STRATEGY 4: HTML scrape listing ----
    const shopUrl = url.includes('/shop') ? url : `${baseUrl}/shop`;
    const scraped = await scrapeProductLinks(shopUrl);
    if (scraped.length > 0) {
      const products = scraped.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        name: p.name,
        description: '',
        price: p.price,
        currency: 'YER',
        images: p.image ? [p.image] : [],
        sizes: ['حسب الطلب'],
        colors: [{ name: 'متعدد', hex: '#888888' }],
        sourceUrl: p.href,
        category: '',
      }));
      return res.status(200).json({ success: true, strategy: 'scrape', products, hasMore: false, nextPage: 1 });
    }

    return res.status(200).json({
      success: false,
      strategy: 'none',
      products: [],
      error: 'لم يتمكن النظام من الوصول إلى بيانات هذا الموقع. جرب رابط صفحة منتج مفرد.',
    });

  } catch (err: any) {
    return res.status(200).json({ success: false, products: [], error: err.message });
  }
}
