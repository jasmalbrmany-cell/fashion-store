import type { VercelRequest, VercelResponse } from '@vercel/node';

// Supported sites with dedicated parsers
const SITE_CONFIGS: Record<string, { currency: string; baseCategory: string }> = {
  'pletino.com': { currency: 'SAR', baseCategory: 'ملابس أطفال' },
  'zahraah.com': { currency: 'YER', baseCategory: '' },
};

function getSiteConfig(url: string) {
  for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
    if (url.includes(domain)) return { domain, ...config };
  }
  return { domain: '', currency: 'YER', baseCategory: '' };
}

// Multiple rendering/proxy services for SPA sites
const RENDER_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

// Rendered HTML proxies (for SPAs like zahraah)
const RENDER_SERVICES = [
  (url: string) => `https://r.jina.ai/${url}`,
];

async function fetchWithTimeout(url: string, timeout = 12000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// Try all proxies until one works
async function fetchHTML(url: string): Promise<string> {
  // Try rendering services first (better for SPAs)
  for (const getProxyUrl of RENDER_SERVICES) {
    try {
      const html = await fetchWithTimeout(getProxyUrl(url), 15000);
      if (html && html.length > 500) return html;
    } catch (e) { /* next */ }
  }
  
  // Fallback to simple proxies
  for (const getProxyUrl of RENDER_PROXIES) {
    try {
      const html = await fetchWithTimeout(getProxyUrl(url));
      if (html && html.length > 200) return html;
    } catch (e) { /* next */ }
  }
  
  throw new Error('All proxies failed');
}

// Extract product images from HTML using multiple strategies
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();
  
  const addImage = (url: string) => {
    if (!url || seen.has(url)) return;
    // Clean URL
    url = url.replace(/&amp;/g, '&');
    if (url.startsWith('//')) url = 'https:' + url;
    if (!url.startsWith('http')) return;
    // Filter out tiny icons/logos
    if (url.includes('favicon') || url.includes('logo') || url.includes('icon') || 
        url.includes('sprite') || url.includes('placeholder') || url.includes('loading')) return;
    // Prefer larger images
    if (url.includes('50x50') || url.includes('32x32') || url.includes('16x16')) return;
    seen.add(url);
    images.push(url);
  };

  // 1. JSON-LD product images
  const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);
      if (product?.image) {
        const imgs = Array.isArray(product.image) ? product.image : [product.image];
        imgs.forEach((img: string) => addImage(img));
      }
    } catch (e) {}
  }

  // 2. OG images
  const ogImages = html.matchAll(/property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/gi);
  for (const m of ogImages) addImage(m[1]);
  const ogImages2 = html.matchAll(/content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/gi);
  for (const m of ogImages2) addImage(m[1]);

  // 3. Twitter card images 
  const twitterImg = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (twitterImg) addImage(twitterImg);

  // 4. Product image patterns in data attributes
  const dataImgs = html.matchAll(/data-(?:src|image|zoom|large|original)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
  for (const m of dataImgs) addImage(m[1]);

  // 5. Image tags with product-related context
  const imgTags = html.matchAll(/<img[^>]*src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*/gi);
  for (const m of imgTags) {
    const fullTag = m[0].toLowerCase();
    if (fullTag.includes('product') || fullTag.includes('gallery') || fullTag.includes('swiper') || 
        fullTag.includes('slider') || fullTag.includes('main') || fullTag.includes('zoom') ||
        fullTag.includes('r2.dev') || fullTag.includes('cdn')) {
      addImage(m[1]);
    }
  }

  // 6. Background images in style attributes
  const bgImgs = html.matchAll(/background-image:\s*url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi);
  for (const m of bgImgs) addImage(m[1]);

  // 7. Zahraah-specific: R2 CDN images
  const r2Imgs = html.matchAll(/(https?:\/\/pub-[a-z0-9]+\.r2\.dev\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/gi);
  for (const m of r2Imgs) addImage(m[1]);

  // 8. JSON strings containing image URLs
  const jsonImgs = html.matchAll(/["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi);
  for (const m of jsonImgs) {
    if (images.length < 15) addImage(m[1]);
  }

  return images.slice(0, 12);
}

// Pletino-specific: extract age-based sizes (e.g. 3-4 سنوات, 6-9 أشهر)
function extractPletinoSizes(html: string): string[] {
  const sizes: string[] = [];
  const seen = new Set<string>();

  // Age-based sizes from WooCommerce variations
  const agePatterns = [
    /(\d{1,2}[-–]\d{1,2}\s*(?:سنوات?|أشهر|شهر|سنة))/g,
    /(\d{1,2}[-–]\d{1,2}\s*(?:years?|months?))/gi,
    /حديث الولادة/g,
    /مواليد/g,
  ];
  for (const pat of agePatterns) {
    const ms = html.matchAll(pat);
    for (const m of ms) {
      const s = m[1] || m[0];
      if (s && !seen.has(s)) { seen.add(s); sizes.push(s); }
    }
  }

  // Standard sizes too
  ['XS','S','M','L','XL','XXL','2XL','3XL'].forEach(s => {
    const re = new RegExp(`"${s}"|'${s}'|>${s}<`, 'g');
    if (html.match(re) && !seen.has(s)) { seen.add(s); sizes.push(s); }
  });

  return sizes.length > 0 ? sizes : ['حسب الطلب'];
}

// Extract sizes from HTML
function extractSizes(html: string, isPletino = false): string[] {
  if (isPletino) return extractPletinoSizes(html);
  const sizes: string[] = [];
  const seen = new Set<string>();
  
  const addSize = (s: string) => {
    s = s.trim().toUpperCase();
    if (!s || seen.has(s) || s.length > 10) return;
    seen.add(s);
    sizes.push(s);
  };

  // Common size patterns
  const sizePatterns = [
    /["'](?:size|مقاس)["']\s*:\s*["']([^"']+)["']/gi,
    /data-size=["']([^"']+)["']/gi,
    /class=["'][^"']*size[^"']*["'][^>]*>([^<]{1,10})<\//gi,
    /aria-label=["'][^"']*(?:size|مقاس)[^"']*["'][^>]*>([^<]{1,10})<\//gi,
  ];
  
  for (const pattern of sizePatterns) {
    const matches = html.matchAll(pattern);
    for (const m of matches) {
      const val = m[1].trim();
      if (['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL'].includes(val.toUpperCase())) {
        addSize(val);
      } else if (/^\d{2,3}$/.test(val)) { // numeric sizes like 38, 40, 42
        addSize(val);
      }
    }
  }

  // Look for size buttons/options grouped together
  const sizeGroups = html.matchAll(/(?:XS|S|M|L|XL|XXL|2XL|3XL)(?:\s*[,|/]\s*(?:XS|S|M|L|XL|XXL|2XL|3XL))+/gi);
  for (const m of sizeGroups) {
    m[0].split(/[,|/]/).forEach(s => addSize(s));
  }

  // If no sizes found, check for numbered sizes
  if (sizes.length === 0) {
    const numSizes = html.matchAll(/(?:size|مقاس)[^>]*>(\d{2})</gi);
    for (const m of numSizes) addSize(m[1]);
  }

  return sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'];
}

// Extract colors from HTML
function extractColors(html: string): { name: string; hex: string }[] {
  const colors: { name: string; hex: string }[] = [];
  const seen = new Set<string>();

  const colorMap: Record<string, string> = {
    'أسود': '#1a1a1a', 'black': '#1a1a1a',
    'أبيض': '#ffffff', 'white': '#ffffff',
    'أحمر': '#dc2626', 'red': '#dc2626',
    'أزرق': '#2563eb', 'blue': '#2563eb',
    'أخضر': '#16a34a', 'green': '#16a34a',
    'بيج': '#d4a574', 'beige': '#d4a574',
    'رمادي': '#6b7280', 'gray': '#6b7280', 'grey': '#6b7280',
    'زهري': '#ec4899', 'pink': '#ec4899',
    'بني': '#92400e', 'brown': '#92400e',
    'برتقالي': '#ea580c', 'orange': '#ea580c',
    'أصفر': '#eab308', 'yellow': '#eab308',
    'بنفسجي': '#7c3aed', 'purple': '#7c3aed',
    'كحلي': '#1e3a5f', 'navy': '#1e3a5f',
    'عنابي': '#7f1d1d', 'maroon': '#7f1d1d',
  };

  // Find color references in HTML
  const colorPatterns = [
    /["'](?:color|لون)["']\s*:\s*["']([^"']+)["']/gi,
    /data-color=["']([^"']+)["']/gi,
    /aria-label=["'][^"']*(?:color|لون)[^"']*["']\s*[^>]*>([^<]{1,20})<\//gi,
  ];

  for (const pattern of colorPatterns) {
    const matches = html.matchAll(pattern);
    for (const m of matches) {
      const colorName = m[1].trim().toLowerCase();
      if (colorMap[colorName] && !seen.has(colorName)) {
        seen.add(colorName);
        colors.push({ name: m[1].trim(), hex: colorMap[colorName] });
      }
    }
  }

  // Find hex colors associated with color swatches
  const hexSwatches = html.matchAll(/background(?:-color)?:\s*#([0-9a-fA-F]{3,6})/gi);
  for (const m of hexSwatches) {
    const hex = `#${m[1]}`;
    if (!seen.has(hex) && hex !== '#fff' && hex !== '#ffffff' && hex !== '#000' && hex !== '#000000' && colors.length < 8) {
      seen.add(hex);
      colors.push({ name: hex, hex });
    }
  }

  return colors.length > 0 ? colors : [{ name: 'متعدد الألوان', hex: '#888888' }];
}

// Pletino-specific price extraction (uses ﷼ symbol, e.g. "2.000 ﷼")
function extractPletinoPrice(text: string): number {
  // Format: "2.000 ﷼" or "2,000 ﷼" -> 2000
  const m = text.match(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:﷼|ريال)/u);
  if (m) {
    const raw = m[1].replace(/[.,]/g, '');
    return parseInt(raw, 10);
  }
  // Fallback: any number before ﷼
  const m2 = text.match(/(\d+)\s*﷼/u);
  if (m2) return parseInt(m2[1], 10);
  return 0;
}

// Parse full product data  
function parseProduct(html: string, url: string, currency = 'YER') {
  const isPletino = url.includes('pletino.com');
  let title = '';
  let description = '';
  let price = 0;

  // Pletino-specific: extract clean title from page title
  if (isPletino) {
    const rawTitle = html.match(/Title:\s*(.+)/)?.[1] ||
                     html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    // Pletino title format: "بلاتينو - Product Name"
    title = rawTitle.replace(/^بلاتينو\s*[-–]\s*/u, '').trim();
  }

  // JSON-LD (most reliable)
  const jsonLdBlocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of jsonLdBlocks) {
    try {
      const data = JSON.parse(block[1]);
      const product = Array.isArray(data) ? data.find((d: any) => d['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);
      if (product) {
        if (!title) title = product.name || title;
        description = product.description || description;
        price = parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || price;
      }
    } catch (e) {}
  }

  // Pletino price extraction from text
  if (isPletino && !price) {
    price = extractPletinoPrice(html);
  }

  // OG tags
  if (!title) title = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                      html.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] || '';
  if (!description) description = html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                                  html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1] || '';
  
  // Title tag
  if (!title) title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  if (!description) description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

  // Clean up Pletino title (redundant with above but safety net)
  if (isPletino && title) {
    title = title.replace(/^بلاتينو\s*[-–]\s*/u, '').trim();
  }

  // Price patterns
  if (!price) {
    const pricePatterns = [
      /["']price["']\s*:\s*["']?(\d+[\.,]?\d*)["']?/i,
      /data-price=["'](\d+[\.,]?\d*)["']/i,
      /(\d{2,6})\s*(?:ر\.ي|ريال|YER|SAR)/i,
      /class=["'][^"']*price[^"']*["'][^>]*>\s*(?:[\s\S]*?)(\d{2,6}(?:\.\d{2})?)/i,
    ];
    for (const p of pricePatterns) {
      const m = html.match(p);
      if (m) { price = parseFloat(m[1].replace(',', '.')); if (price > 0) break; }
    }
  }

  // Description fallback using paragraph tags
  if (!description) {
    const pTags = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    let allText = '';
    for (const m of pTags) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 30 && text.length < 500 && !text.includes('تسوق') && !text.includes('حقوق')) {
        allText += text + '\n\n';
      }
    }
    if (allText) description = allText.trim();
  }

  // Jina.ai reader format parsing (markdown-like)
  if (!title && html.includes('Title:')) {
    title = html.match(/Title:\s*(.+)/)?.[1] || '';
  }
  if (!description && html.includes('Description:')) {
    description = html.match(/Description:\s*(.+)/)?.[1] || '';
  }

  // Extract from rendered text (for Jina reader output)
  if (!title) {
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1];
    if (h1) title = h1;
  }

  // Final fallback for description
  if (!description) {
    description = isPletino
      ? 'منتج عالي الجودة من متجر بلاتينو لملابس الأطفال. تصميم أنيق وعصري مناسب لمختلف المناسبات.'
      : 'نقدم لك هذا المنتج المتميز بتصميمه العصري الذي يواكب أحدث صيحات الموضة. تم تصنيع هذا المنتج بعناية فائقة باستخدام خامات عالية الجودة لضمان الراحة والاستدامة.';
  }

  const images = extractImages(html, url);
  const sizes = extractSizes(html, isPletino);
  const colors = extractColors(html);

  return { title, description, price, images, sizes, colors, currency };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  // Determine site config
  const siteConfig = getSiteConfig(url);

  try {
    const html = await fetchHTML(url);
    const result = parseProduct(html, url, siteConfig.currency);

    // Even partial data is success
    const hasUsefulData = result.title || result.images.length > 0 || result.sizes.length > 0;

    return res.status(200).json({
      success: hasUsefulData,
      partial: !result.title || result.images.length === 0,
      sourceSite: siteConfig.domain || 'unknown',
      suggestedCategory: siteConfig.baseCategory,
      data: result
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return res.status(200).json({
      success: false,
      error: error.message || 'Failed to scrape',
      data: { title: '', description: '', price: 0, images: [], sizes: ['حسب الطلب'], colors: [{ name: 'متعدد الألوان', hex: '#888888' }], currency: siteConfig.currency }
    });
  }
}
