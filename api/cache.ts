/**
 * Simple in-memory caching system with TTL support
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
  hits: number;
  created: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of entries
  private cleanupInterval = 60000; // Cleanup every minute

  constructor() {
    // Periodic cleanup of expired entries
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = 3600000): void {
    // TTL in milliseconds (default: 1 hour)
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      hits: 0,
      created: Date.now(),
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalHits = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      if (now > entry.expiry) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      expiredCount,
      hitRate: this.cache.size > 0 ? (totalHits / this.cache.size).toFixed(2) : '0',
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.created < lruTime) {
        lruTime = entry.created;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Evicted LRU entry: ${lruKey}`);
      }
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  ttl: number = 3600000,
  keyGenerator?: (...args: any[]) => string
) {
  return async (...args: any[]): Promise<T> => {
    const cacheKey = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Try to get from cache
    const cached = cacheManager.get<T>(cacheKey);
    if (cached !== null) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Cache] Hit: ${cacheKey}`);
      }
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cacheManager.set(cacheKey, result, ttl);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] Set: ${cacheKey}`);
    }

    return result;
  };
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  products: (page: number, limit: number) => `products:${page}:${limit}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  scrape: (url: string) => `scrape:${Buffer.from(url).toString('base64')}`,
  catalog: (url: string, page: number) => `catalog:${Buffer.from(url).toString('base64')}:${page}`,
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  product: (id: string) => cacheManager.delete(cacheKeys.product(id)),
  products: () => {
    // Invalidate all product pages
    for (let i = 1; i <= 100; i++) {
      cacheManager.delete(cacheKeys.products(i, 20));
    }
  },
  categories: () => cacheManager.delete(cacheKeys.categories()),
  all: () => cacheManager.clear(),
};
