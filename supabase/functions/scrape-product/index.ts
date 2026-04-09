import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // High-quality User Agents to avoid bot detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    console.log(`Scraping URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': randomUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Target URL: ${response.statusText}`);
    }

    const html = await response.text();

    // Simple RegEx based extraction (Safe for Edge Functions without full DOM)
    // In a real scenario, we might use a lightweight parser but RegEx for OG tags is very efficient
    
    // 1. Title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || 
                       html.match(/<meta property="og:title" content="(.*?)"/i) ||
                       html.match(/<h1.*?>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // 2. Price
    // Price RegEx is tricky, we look for currency symbols or data attributes
    const priceMatch = html.match(/price["':\s]+([0-9.,]+)/i) || 
                       html.match(/itemprop="price" content="([0-9.,]+)"/i) ||
                       html.match(/<meta property="og:price:amount" content="([0-9.,]+)"/i);
    const price = priceMatch ? priceMatch[1].replace(/,/g, '') : '';

    // 3. Images
    const images: string[] = [];
    const ogImage = html.match(/<meta property="og:image" content="(.*?)"/i);
    if (ogImage) images.push(ogImage[1]);

    // Secondary images (common patterns)
    const imgMatches = html.matchAll(/<img[^>]+src="([^">]+\.(?:jpg|jpeg|png|webp)[^">]*)"/gi);
    for (const match of imgMatches) {
      const src = match[1];
      if (src && !src.includes('logo') && !src.includes('icon') && !images.includes(src)) {
        images.push(src.startsWith('//') ? `https:${src}` : src);
      }
      if (images.length > 10) break;
    }

    // 4. Description
    const descMatch = html.match(/<meta name="description" content="(.*?)"/i) ||
                      html.match(/<meta property="og:description" content="(.*?)"/i);
    const description = descMatch ? descMatch[1].trim() : '';

    return new Response(JSON.stringify({
      success: true,
      data: {
        title,
        price: parseFloat(price) || 0,
        description,
        images: images.filter(img => img.startsWith('http')),
        rawHtml: html.substring(0, 1000) // For debugging
      }
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scraper Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
