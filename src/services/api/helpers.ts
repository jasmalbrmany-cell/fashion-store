import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { 
  Product, Category, City, Currency, Order, Ad, ActivityLog, StoreSettings, User 
} from '@/types';
import type { 
  ProductRow, CategoryRow, CityRow, CurrencyRow, OrderRow, AdRow, ProfileRow 
} from './types';

// Helper to prevent infinite hangs - reduced to 15s for faster response
export const withTimeout = (promise: Promise<any>, timeoutMs = 15000): Promise<any> => {
  return Promise.race([
    promise,
    new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout after ' + timeoutMs + 'ms')), timeoutMs))
  ]);
};

// --- Caching Logic ---
const CACHE_TTL_SHORT = 3 * 60 * 1000;
const CACHE_TTL_LONG = 10 * 60 * 1000;
const LONG_TTL_KEYS = ['categories_all', 'cities_all', 'cities_active', 'currencies_all', 'settings_main', 'statistics_main'];

const memoryCache: Record<string, { data: any; timestamp: number }> = {};

const getCacheTTL = (key: string) => LONG_TTL_KEYS.includes(key) ? CACHE_TTL_LONG : CACHE_TTL_SHORT;

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getFromCache = (key: string) => {
  const ttl = getCacheTTL(key);
  if (memoryCache[key]) {
    const isStale = Date.now() - memoryCache[key].timestamp > ttl;
    if (!isStale) return memoryCache[key].data;
  }
  const stored = getStorageItem<{ data: any; timestamp: number } | null>(`cache_${key}`, null);
  if (stored) {
    const isStale = Date.now() - stored.timestamp > ttl;
    if (!isStale) {
      memoryCache[key] = stored;
      return stored.data;
    }
  }
  return null;
};

export const setToCache = (key: string, data: any) => {
  const cacheEntry = { data, timestamp: Date.now() };
  memoryCache[key] = cacheEntry;
  setStorageItem(`cache_${key}`, cacheEntry);
};

export const clearCache = (key: string) => {
  delete memoryCache[key];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`cache_${key}`);
  }
};

export const hasValidCache = (key: string): boolean => {
  const ttl = getCacheTTL(key);
  if (memoryCache[key]) {
    const isStale = Date.now() - memoryCache[key].timestamp > ttl;
    return !isStale;
  }
  const stored = getStorageItem<{ data: any; timestamp: number } | null>(`cache_${key}`, null);
  if (stored) {
    const isStale = Date.now() - stored.timestamp > ttl;
    return !isStale;
  }
  return false;
};

export const getCachedSync = <T>(key: string): T | null => {
  return getFromCache(key) as T | null;
};

// --- Transformation Functions ---
export function transformProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price,
    categoryId: row.category_id || '',
    images: row.images || [],
    sizes: row.sizes || [],
    colors: row.colors || [],
    stock: row.stock,
    isVisible: row.is_visible,
    sourceUrl: row.source_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformProductToDb(product: Partial<Product>): Record<string, unknown> {
  return {
    name: product.name,
    description: product.description,
    price: product.price,
    category_id: product.categoryId,
    images: product.images,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    is_visible: product.isVisible,
    source_url: product.sourceUrl,
  };
}

export function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    parentId: row.parent_id || undefined,
    order: row.order,
    whatsappNumber: row.whatsapp_number || undefined,
  };
}

export function transformCity(row: CityRow): City {
  return {
    id: row.id,
    name: row.name,
    shippingCost: row.shipping_cost,
    isActive: row.is_active,
  };
}

export function transformCurrency(row: CurrencyRow): Currency {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    exchangeRate: row.exchange_rate,
    symbol: row.symbol,
  };
}

export function transformOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerId: row.customer_id || undefined,
    city: row.city,
    address: row.address || undefined,
    items: row.items || [],
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    total: row.total,
    status: row.status,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transformAd(row: AdRow): Ad {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    content: row.content || '',
    imageUrl: row.image_url || undefined,
    videoUrl: row.video_url || undefined,
    link: row.link || undefined,
    position: row.position,
    isActive: row.is_active,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    order: row.order,
    createdAt: row.created_at,
  };
}

export function transformProfile(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    avatar: row.avatar || undefined,
    created_at: row.created_at,
  };
}

export function transformActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || '',
    userName: (row.user_name as string) || '',
    action: row.action as string,
    details: row.details as string | undefined,
    createdAt: row.created_at as string,
  };
}
