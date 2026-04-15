
/**
 * Shein Scraper Utility
 * Extract product data from Shein URLs
 */

export interface SheinProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  sourceUrl: string;
  category: string;
}

export async function scrapeSheinProduct(html: string, url: string): Promise<SheinProduct | null> {
  try {
    // 1. Try to find the JSON data in the HTML - multiple Shein variants
    const jsonMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({.+?});/s) || 
                      html.match(/window\.gbData\s*=\s*({.+?});/s) ||
                      html.match(/var\s+productIntroData\s*=\s*({.+?});/s) ||
                      html.match(/window\.commonData\s*=\s*({.+?});/s);
    
    if (!jsonMatch) {
      // Fallback: try to find any large JSON-like block that might be it
      const largeJson = html.match(/{"productIntroData":\s*({.+?})}/s);
      if (largeJson) {
        return scrapeSheinProduct(largeJson[0], url); // recursion with smaller block
      }
      return null;
    }

    let data;
    try {
      data = JSON.parse(jsonMatch[1]);
    } catch (e) {
      // Try to fix some common JSON errors in scripts
      const fixed = jsonMatch[1].replace(/\\'/g, "'").replace(/undefined/g, "null");
      try {
        data = JSON.parse(fixed);
      } catch (e2) {
        return null;
      }
    }

    const productBase = data.productIntroData || data.goodsInfo || data;
    const detail = productBase.detail || productBase;

    const name = detail.m_name || detail.goods_name || '';
    const price = parseFloat(detail.salePrice?.amount || detail.retailPrice?.amount || '0');
    const currency = detail.salePrice?.currency || 'USD';
    
    // Images
    const images: string[] = [];
    if (detail.main_image) images.push(detail.main_image.url || detail.main_image);
    if (detail.image_list) {
      detail.image_list.forEach((img: any) => {
        const u = img.url || img.origin_image || img;
        if (typeof u === 'string' && !images.includes(u)) images.push(u);
      });
    }
    // Variant images
    if (detail.color_list) {
      detail.color_list.forEach((c: any) => {
        if (c.image_url && !images.includes(c.image_url)) images.push(c.image_url);
      });
    }

    // Sizes
    const sizes: string[] = [];
    if (detail.sku_list) {
      detail.sku_list.forEach((sku: any) => {
        const size = sku.attr_value_name_en || sku.attr_value_name;
        if (size && !sizes.includes(size)) sizes.push(size);
      });
    }

    // Colors
    const colors: { name: string; hex: string }[] = [];
    if (detail.color_list) {
      detail.color_list.forEach((c: any) => {
        colors.push({ 
          name: c.color_name || 'Color', 
          hex: c.color_value || '#888888' 
        });
      });
    }

    return {
      id: detail.goods_id?.toString() || Math.random().toString(36).substr(2, 9),
      name,
      description: detail.product_details || '',
      price,
      currency,
      images: images.map(img => img.startsWith('//') ? 'https:' + img : img),
      sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
      colors: colors.length > 0 ? colors : [{ name: 'متعدد', hex: '#888888' }],
      sourceUrl: url,
      category: detail.category_name || '',
    };
  } catch (err) {
    console.error('Shein Scrape Error:', err);
    return null;
  }
}

export async function scrapeSheinCategory(html: string, url: string): Promise<SheinProduct[]> {
  try {
    const jsonMatch = html.match(/window\.__INITIAL_DATA__\s*=\s*({.+?});/s) || 
                      html.match(/window\.gbData\s*=\s*({.+?});/s);
    
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[1]);
    const goodsList = data.goodsList || data.catGoodsList || [];
    
    return goodsList.map((g: any) => ({
      id: g.goods_id?.toString() || Math.random().toString(36).substr(2, 9),
      name: g.goods_name || '',
      description: '',
      price: parseFloat(g.salePrice?.amount || g.retailPrice?.amount || '0'),
      currency: g.salePrice?.currency || 'USD',
      images: [g.goods_img].filter(Boolean).map((img: string) => img.startsWith('//') ? 'https:' + img : img),
      sizes: ['حسب الطلب'],
      colors: [{ name: 'متعدد', hex: '#888888' }],
      sourceUrl: g.url ? (g.url.startsWith('http') ? g.url : new URL(url).origin + g.url) : '',
      category: '',
    }));
  } catch (err) {
    console.error('Shein Category Scrape Error:', err);
    return [];
  }
}
