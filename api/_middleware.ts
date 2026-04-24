interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute per IP
};

export function rateLimit(req: any): { allowed: boolean; remaining: number } {
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const key = Array.isArray(ip) ? ip[0] : ip;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment request count
  entry.count++;

  // Check if limit exceeded
  const allowed = entry.count <= RATE_LIMIT.maxRequests;
  const remaining = Math.max(0, RATE_LIMIT.maxRequests - entry.count);

  return { allowed, remaining };
}

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Clean every minute
}

// Enhanced rate limiting with user-based tracking
export function rateLimitByUser(req: any, userId?: string): { allowed: boolean; remaining: number } {
  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const key = userId ? `user:${userId}` : `ip:${Array.isArray(ip) ? ip[0] : ip}`;
  
  return rateLimit({ ...req, headers: { ...req.headers, 'x-forwarded-for': key } });
}

export function corsHeaders(res: any, origin?: string) {
  // Allow all origins for API routes — vercel.json CORS headers handle security at the edge
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleOptions(req: any, res: any): boolean {
  if (req.method === 'OPTIONS') {
    corsHeaders(res, req.headers.origin);
    res.status(200).end();
    return true;
  }
  return false;
}
