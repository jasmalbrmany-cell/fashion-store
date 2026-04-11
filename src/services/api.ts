import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Product, Category, City, Currency, Order, Ad, ActivityLog, StoreSettings, User, Statistics } from '@/types';
import { 
  mockProducts as initialProducts, 
  mockCategories as initialCategories, 
  mockCities as initialCities, 
  mockCurrencies as initialCurrencies, 
  mockOrders as initialOrders, 
  mockAds as initialAds, 
  mockActivityLogs as initialActivityLogs, 
  mockStoreSettings as initialStoreSettings, 
  mockUsers as initialUsers 
} from '@/data/mockData';

// Helper to prevent infinite hangs when Supabase tables don't exist or network fails
export const withTimeout = <T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout after ' + timeoutMs + 'ms')), timeoutMs))
  ]);
};
// Utility to persist mock data in Demo Mode (localStorage)
const STORAGE_KEYS = {
  PRODUCTS: 'fashionhub_v2_products',
  CATEGORIES: 'fashionhub_v2_categories',
  CITIES: 'fashionhub_v2_cities',
  CURRENCIES: 'fashionhub_v2_currencies',
  ORDERS: 'fashionhub_v2_orders',
  ADS: 'fashionhub_v2_ads',
  ACTIVITY: 'fashionhub_v2_activity',
  SETTINGS: 'fashionhub_v2_settings',
  USERS: 'fashionhub_mock_users', // Kept original to preserve existing registered customers
};

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

// Local state for Demo Mode, initialized from localStorage or initial mock data
const mockProducts: Product[] = getStorageItem(STORAGE_KEYS.PRODUCTS, initialProducts) || [];
const mockCategories: Category[] = getStorageItem(STORAGE_KEYS.CATEGORIES, initialCategories) || [];
const mockCities: City[] = getStorageItem(STORAGE_KEYS.CITIES, initialCities) || [];
const mockCurrencies: Currency[] = getStorageItem(STORAGE_KEYS.CURRENCIES, initialCurrencies) || [];
const mockOrders: Order[] = getStorageItem(STORAGE_KEYS.ORDERS, initialOrders) || [];
const mockAds: Ad[] = getStorageItem(STORAGE_KEYS.ADS, initialAds) || [];
const mockActivityLogs: ActivityLog[] = getStorageItem(STORAGE_KEYS.ACTIVITY, initialActivityLogs) || [];
const mockStoreSettings = getStorageItem(STORAGE_KEYS.SETTINGS, initialStoreSettings) || initialStoreSettings;
const mockUsers: User[] = getStorageItem(STORAGE_KEYS.USERS, initialUsers) || [];

// Cache duration (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Simple session + local storage hybrid cache
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

const getFromCache = (key: string) => {
  // 1. Check memory first
  if (memoryCache[key]) {
    const isStale = Date.now() - memoryCache[key].timestamp > CACHE_TTL;
    if (!isStale) return memoryCache[key].data;
  }

  // 2. Check local storage
  const stored = getStorageItem<{ data: any; timestamp: number } | null>(`cache_${key}`, null);
  if (stored) {
    const isStale = Date.now() - stored.timestamp > CACHE_TTL;
    if (!isStale) {
      memoryCache[key] = stored; // populate memory
      return stored.data;
    }
  }

  return null;
};

const setToCache = (key: string, data: any) => {
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
  if (memoryCache[key]) {
    const isStale = Date.now() - memoryCache[key].timestamp > CACHE_TTL;
    return !isStale;
  }
  const stored = getStorageItem<{ data: any; timestamp: number } | null>(`cache_${key}`, null);
  if (stored) {
    const isStale = Date.now() - stored.timestamp > CACHE_TTL;
    return !isStale;
  }
  return false;
};

export const getCachedSync = <T>(key: string): T | null => {
  return getFromCache(key) as T | null;
};

// Syncing functions
const syncProducts = () => {
  setStorageItem(STORAGE_KEYS.PRODUCTS, mockProducts);
  setToCache('products_all', mockProducts);
};
const syncCategories = () => {
  setStorageItem(STORAGE_KEYS.CATEGORIES, mockCategories);
  setToCache('categories_all', mockCategories);
};
const syncCities = () => {
  setStorageItem(STORAGE_KEYS.CITIES, mockCities);
  setToCache('cities_all', mockCities);
};
const syncCurrencies = () => {
  setStorageItem(STORAGE_KEYS.CURRENCIES, mockCurrencies);
  setToCache('currencies_all', mockCurrencies);
};
const syncOrders = () => {
  setStorageItem(STORAGE_KEYS.ORDERS, mockOrders);
  setToCache('orders_all', mockOrders);
};
const syncAds = () => {
  setStorageItem(STORAGE_KEYS.ADS, mockAds);
  setToCache('ads_all', mockAds);
};
const syncActivity = () => {
  setStorageItem(STORAGE_KEYS.ACTIVITY, mockActivityLogs);
  setToCache('activity_all', mockActivityLogs);
};
const syncSettings = () => {
  setStorageItem(STORAGE_KEYS.SETTINGS, mockStoreSettings);
  setToCache('settings_main', mockStoreSettings);
};
const syncUsers = () => {
  setStorageItem(STORAGE_KEYS.USERS, mockUsers);
  setToCache('users_all', mockUsers);
};

// Types for database rows
interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  images: { id: string; url: string; isPrimary: boolean }[];
  sizes: { id: string; name: string; stock: number; priceModifier: number }[];
  colors: { id: string; name: string; hex: string; stock: number }[];
  stock: number;
  is_visible: boolean;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

interface CityRow {
  id: string;
  name: string;
  shipping_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CurrencyRow {
  id: string;
  code: string;
  name: string;
  exchange_rate: number;
  symbol: string;
  created_at: string;
  updated_at: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_id: string | null;
  city: string;
  address: string | null;
  items: { id: string; productId: string; productName: string; productImage: string; size?: string; color?: string; quantity: number; price: number; sourceUrl?: string }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: 'pending' | 'waiting_payment' | 'paid' | 'approved' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AdRow {
  id: string;
  title: string;
  type: 'image' | 'video' | 'text';
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  link: string | null;
  position: 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'editor' | 'viewer' | 'customer';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// PRODUCTS SERVICE
// ============================================

export const productsService = {
  async getAll(): Promise<Product[]> {
    const cached = getFromCache('products_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockProducts.filter(p => p.isVisible);
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching products:', error);
        return mockProducts.filter(p => p.isVisible);
      }

      const transformed = (data || []).map(transformProduct);
      setToCache('products_all', transformed);
      return transformed;
    } catch (e) {
      return mockProducts.filter(p => p.isVisible);
    }
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return mockProducts.filter(p => p.categoryId === categoryId && p.isVisible);
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching products by category:', error);
        return mockProducts.filter(p => p.categoryId === categoryId && p.isVisible);
      }

      return (data || []).map(transformProduct);
    } catch (e) {
      return mockProducts.filter(p => p.categoryId === categoryId && p.isVisible);
    }
  },

  async getById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      return mockProducts.find(p => p.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return mockProducts.find(p => p.id === id) || null;
    }

    return transformProduct(data);
  },

  async search(query: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      const q = query.toLowerCase();
      return mockProducts.filter(
        p => p.isVisible && (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      );
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return (data || []).map(transformProduct);
  },

  async getAllAdmin(): Promise<Product[]> {
    const cached = getFromCache('products_admin_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockProducts;
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching admin products:', error);
        return mockProducts;
      }

      const transformed = (data || []).map(transformProduct);
      setToCache('products_admin_all', transformed);
      return transformed;
    } catch (e) {
      return mockProducts;
    }
  },

  async create(product: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const newProduct = { ...product, id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product;
      mockProducts.unshift(newProduct);
      syncProducts();
      return newProduct;
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .insert(transformProductToDb(product))
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error creating product:', error);
        
        // Fallback to local
        const newProduct = { ...product, id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product;
        mockProducts.unshift(newProduct);
        syncProducts();
        return newProduct;
      }
      clearCache('products_all');
      clearCache('products_admin_all');
      return transformProduct(data);
    } catch (e) {
      console.error('Exception creating product:', e);
      // Fallback to local
      const newProduct = { ...product, id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product;
      mockProducts.unshift(newProduct);
      syncProducts();
      return newProduct;
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
        mockProducts[index] = { ...mockProducts[index], ...updates, updatedAt: new Date().toISOString() };
        syncProducts();
        return mockProducts[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .update(transformProductToDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      // Fallback to local
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
        mockProducts[index] = { ...mockProducts[index], ...updates, updatedAt: new Date().toISOString() };
        syncProducts();
        return mockProducts[index];
      }
      return null;
    }

    clearCache('products_all');
    return transformProduct(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
        mockProducts.splice(index, 1);
        syncProducts();
        return true;
      }
      return false;
    }

    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }

    clearCache('products_all');
    return true;
  },

  async toggleVisibility(id: string): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;
    return this.update(id, { isVisible: !product.isVisible });
  },
};

// ============================================
// CATEGORIES SERVICE
// ============================================

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const cached = getFromCache('categories_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockCategories;
    }

    const fetchPromise = (supabase as any)
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching categories:', error);
        return mockCategories;
      }

      const transformed = (data || []).map(transformCategory);
      setToCache('categories_all', transformed);
      return transformed;
    } catch (e) {
      return mockCategories;
    }
  },

  async getById(id: string): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      return mockCategories.find(c => c.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return mockCategories.find(c => c.id === id) || null;
    }

    return transformCategory(data);
  },

  async create(category: Partial<Category>): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      const newCategory = { ...category, id: `cat-${Date.now()}`, order: category.order || mockCategories.length + 1 } as Category;
      mockCategories.push(newCategory);
      syncCategories();
      return newCategory;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .insert({
        name: category.name || '',
        icon: category.icon,
        order: category.order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    clearCache('categories_all');
    return transformCategory(data);
  },

  async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCategories.findIndex(c => c.id === id);
      if (index > -1) {
        mockCategories[index] = { ...mockCategories[index], ...updates };
        syncCategories();
        return mockCategories[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .update({
        name: updates.name,
        icon: updates.icon,
        order: updates.order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    clearCache('categories_all');
    return transformCategory(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCategories.findIndex(c => c.id === id);
      if (index > -1) {
        mockCategories.splice(index, 1);
        syncCategories();
        return true;
      }
      return false;
    }

    const { error } = await (supabase as any)
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    clearCache('categories_all');
    return true;
  },
};

// ============================================
// CITIES SERVICE
// ============================================

export const citiesService = {
  async getAll(): Promise<City[]> {
    const cached = getFromCache('cities_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockCities;
    }

    const fetchPromise = (supabase as any)
      .from('cities')
      .select('*')
      .order('name', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching cities:', error);
        return mockCities;
      }

      const results = (data || []).map(transformCity);
      const uniqueResults: City[] = [];
      const seenNames = new Set<string>();

      for (const city of results) {
        const nameKey = city.name.trim().toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          uniqueResults.push(city);
        }
      }

      setToCache('cities_all', uniqueResults);
      return uniqueResults;
    } catch (e) {
      return mockCities;
    }
  },

  async getActive(): Promise<City[]> {
    const cached = getFromCache('cities_active');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockCities.filter(c => c.isActive);
    }

    const fetchPromise = (supabase as any)
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching active cities:', error);
        return mockCities.filter(c => c.isActive);
      }

      const results = (data || []).map(transformCity);
      const uniqueResults: City[] = [];
      const seenNames = new Set<string>();

      for (const city of results) {
        const nameKey = city.name.trim().toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          uniqueResults.push(city);
        }
      }

      setToCache('cities_active', uniqueResults);
      return uniqueResults;
    } catch (e) {
      return mockCities.filter(c => c.isActive);
    }
  },

  async getById(id: string): Promise<City | null> {
    if (!isSupabaseConfigured()) {
      return mockCities.find(c => c.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching city:', error);
      return mockCities.find(c => c.id === id) || null;
    }

    return transformCity(data);
  },

  async create(city: Partial<City>): Promise<City | null> {
    if (!isSupabaseConfigured()) {
      const newCity = { ...city, id: `city-${Date.now()}`, isActive: city.isActive ?? true } as City;
      mockCities.push(newCity);
      syncCities();
      return newCity;
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .insert({
        name: city.name || '',
        shipping_cost: city.shippingCost || 0,
        is_active: city.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating city:', error);
      throw new Error(error.message);
    }

    clearCache('cities_all');
    clearCache('cities_active');
    return transformCity(data);
  },

  async update(id: string, updates: Partial<City>): Promise<City | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCities.findIndex(c => c.id === id);
      if (index > -1) {
        mockCities[index] = { ...mockCities[index], ...updates };
        syncCities();
        return mockCities[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .update({
        name: updates.name,
        shipping_cost: updates.shippingCost,
        is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating city:', error);
      throw new Error(error.message);
    }

    clearCache('cities_all');
    clearCache('cities_active');
    return transformCity(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCities.findIndex(c => c.id === id);
      if (index > -1) {
        mockCities.splice(index, 1);
        syncCities();
        return true;
      }
      return false;
    }

    const { error } = await (supabase as any)
      .from('cities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting city:', error);
      throw new Error(error.message);
    }

    clearCache('cities_all');
    clearCache('cities_active');
    return true;
  },
};

// ============================================
// CURRENCIES SERVICE
// ============================================

export const currenciesService = {
  async getAll(): Promise<Currency[]> {
    const cached = getFromCache('currencies_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockCurrencies;
    }

    const fetchPromise = (supabase as any)
      .from('currencies')
      .select('*')
      .order('code', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching currencies:', error);
        return mockCurrencies;
      }

      const transformed = (data || []).map(transformCurrency);
      setToCache('currencies_all', transformed);
      return transformed;
    } catch (e) {
      return mockCurrencies;
    }
  },

  async getByCode(code: string): Promise<Currency | null> {
    if (!isSupabaseConfigured()) {
      return mockCurrencies.find(c => c.code === code) || null;
    }

    const { data, error } = await (supabase as any)
      .from('currencies')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching currency:', error);
      return mockCurrencies.find(c => c.code === code) || null;
    }

    return transformCurrency(data);
  },

  async create(currency: Partial<Currency>): Promise<Currency | null> {
    if (!isSupabaseConfigured()) {
      const newCurrency = { ...currency, id: `cur-${Date.now()}` } as Currency;
      mockCurrencies.push(newCurrency);
      syncCurrencies();
      return newCurrency;
    }

    const fetchPromise = (supabase as any)
      .from('currencies')
      .insert({
        code: currency.code || '',
        name: currency.name || '',
        exchange_rate: currency.exchangeRate || 1,
        symbol: currency.symbol || '',
      })
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error creating currency:', error);
        return null;
      }
      clearCache('currencies_all');
      return transformCurrency(data);
    } catch (e) {
      return null;
    }
  },

  async update(id: string, updates: Partial<Currency>): Promise<Currency | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCurrencies.findIndex(c => c.id === id);
      if (index > -1) {
        mockCurrencies[index] = { ...mockCurrencies[index], ...updates };
        syncCurrencies();
        return mockCurrencies[index];
      }
      return null;
    }

    const fetchPromise = (supabase as any)
      .from('currencies')
      .update({
        code: updates.code,
        name: updates.name,
        exchange_rate: updates.exchangeRate,
        symbol: updates.symbol,
      })
      .eq('id', id)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error updating currency:', error);
        return null;
      }
      clearCache('currencies_all');
      return transformCurrency(data);
    } catch (e) {
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCurrencies.findIndex(c => c.id === id);
      if (index > -1) {
        mockCurrencies.splice(index, 1);
        syncCurrencies();
        return true;
      }
      return false;
    }

    const fetchPromise = (supabase as any).from('currencies').delete().eq('id', id);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));

    try {
      const { error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error deleting currency:', error);
        return false;
      }
      clearCache('currencies_all');
      return true;
    } catch (e) {
      return false;
    }
  },
};

// ============================================
// ORDERS SERVICE
// ============================================

export const ordersService = {
  async getAll(): Promise<Order[]> {
    const cached = getFromCache('orders_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockOrders;
    }

    const { data, error } = await withTimeout((supabase as any)
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching orders:', error);
      return mockOrders;
    }

    const transformed = (data || []).map(transformOrder);
    setToCache('orders_all', transformed);
    return transformed;
  },

  async getById(id: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return mockOrders.find(o => o.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return mockOrders.find(o => o.id === id) || null;
    }

    return transformOrder(data);
  },

  async getByNumber(orderNumber: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return mockOrders.find(o => o.orderNumber === orderNumber) || null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      console.error('Error fetching order by number:', error);
      return mockOrders.find(o => o.orderNumber === orderNumber) || null;
    }

    return transformOrder(data);
  },

  async getByStatus(status: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return mockOrders.filter(o => o.status === status);
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders by status:', error);
      return mockOrders.filter(o => o.status === status);
    }

    return (data || []).map(transformOrder);
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return mockOrders.filter(o => o.customerId === customerId);
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return mockOrders.filter(o => o.customerId === customerId);
    }

    return (data || []).map(transformOrder);
  },

  async create(order: Partial<Order>): Promise<Order | null> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    if (!isSupabaseConfigured()) {
      const newOrder = {
        ...order,
        id: `order-${Date.now()}`,
        orderNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Order;
      mockOrders.push(newOrder);
      syncOrders();
      return newOrder;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: order.customerName || '',
        customer_phone: order.customerPhone || '',
        customer_id: order.customerId,
        city: order.city || '',
        address: order.address,
        items: order.items || [],
        subtotal: order.subtotal || 0,
        shipping_cost: order.shippingCost || 0,
        total: order.total || 0,
        notes: order.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return transformOrder(data);
  },

  async updateStatus(id: string, status: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      const index = mockOrders.findIndex(o => o.id === id);
      if (index > -1) {
        mockOrders[index] = { ...mockOrders[index], status: status as Order['status'], updatedAt: new Date().toISOString() };
        syncOrders();
        return mockOrders[index];
      }
      return null;
    }

    const fetchPromise = (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error updating order status:', error);
        return null;
      }
      clearCache('orders_all');
      clearCache('statistics_main');
      return transformOrder(data);
    } catch (e) {
      return null;
    }
  },

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      const index = mockOrders.findIndex(o => o.id === id);
      if (index > -1) {
        mockOrders[index] = { ...mockOrders[index], ...updates, updatedAt: new Date().toISOString() };
        syncOrders();
        return mockOrders[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .update({
        customer_name: updates.customerName,
        customer_phone: updates.customerPhone,
        city: updates.city,
        address: updates.address,
        items: updates.items,
        subtotal: updates.subtotal,
        shipping_cost: updates.shippingCost,
        total: updates.total,
        status: updates.status,
        notes: updates.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return null;
    }

    return transformOrder(data);
  },
};

// ============================================
// ADS SERVICE
// ============================================

export const adsService = {
  async getActive(): Promise<Ad[]> {
    const cached = getFromCache('ads_active');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockAds.filter(a => a.isActive);
    }

    const fetchPromise = (supabase as any)
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching active ads:', error);
        return mockAds.filter(a => a.isActive);
      }

      const transformed = (data || []).map(transformAd);
      setToCache('ads_active', transformed);
      return transformed;
    } catch (e) {
      return mockAds.filter(a => a.isActive);
    }
  },

  async getAll(): Promise<Ad[]> {
    const cached = getFromCache('ads_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockAds;
    }

    const fetchPromise = (supabase as any)
      .from('ads')
      .select('*')
      .order('order', { ascending: true });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching ads:', error);
        return mockAds;
      }

      const transformed = (data || []).map(transformAd);
      setToCache('ads_all', transformed);
      return transformed;
    } catch (e) {
      return mockAds;
    }
  },

  async getById(id: string): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      return mockAds.find(a => a.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ad:', error);
      return mockAds.find(a => a.id === id) || null;
    }

    return transformAd(data);
  },

  async create(ad: Partial<Ad>): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      const newAd = { ...ad, id: `ad-${Date.now()}`, createdAt: new Date().toISOString() } as Ad;
      mockAds.push(newAd);
      syncAds();
      return newAd;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .insert({
        title: ad.title || '',
        type: ad.type || 'image',
        content: ad.content,
        image_url: ad.imageUrl,
        video_url: ad.videoUrl,
        link: ad.link,
        position: ad.position || 'top',
        is_active: ad.isActive ?? true,
        order: ad.order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad:', error);
      throw new Error(error.message);
    }

    return transformAd(data);
  },

  async update(id: string, updates: Partial<Ad>): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      const index = mockAds.findIndex(a => a.id === id);
      if (index > -1) {
        mockAds[index] = { ...mockAds[index], ...updates };
        syncAds();
        return mockAds[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .update({
        title: updates.title,
        type: updates.type,
        content: updates.content,
        image_url: updates.imageUrl,
        video_url: updates.videoUrl,
        link: updates.link,
        position: updates.position,
        is_active: updates.isActive,
        order: updates.order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad:', error);
      throw new Error(error.message);
    }

    return transformAd(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockAds.findIndex(a => a.id === id);
      if (index > -1) {
        mockAds.splice(index, 1);
        syncAds();
        return true;
      }
      return false;
    }

    const { error } = await (supabase as any)
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ad:', error);
      return false;
    }

    return true;
  },
};

// ============================================
// USERS SERVICE
// ============================================

export const usersService = {
  async getAll(): Promise<User[]> {
    const cached = getFromCache('users_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockUsers;
    }

    const { data, error } = await withTimeout((supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching users:', error);
      return mockUsers;
    }

    const transformed = (data || []).map(transformProfile);
    setToCache('users_all', transformed);
    return transformed;
  },

  async getById(id: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return mockUsers.find(u => u.id === id) || null;
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return mockUsers.find(u => u.id === id) || null;
    }

    return transformProfile(data);
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index > -1) {
        mockUsers[index] = { ...mockUsers[index], ...updates };
        syncUsers();
        return mockUsers[index];
      }
      return null;
    }

    const fetchPromise = (supabase as any)
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        role: updates.role,
        avatar: updates.avatar,
      })
      .eq('id', id)
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error) {
        console.error('Error updating user:', error);
        return null;
      }
      clearCache('users_all');
      return transformProfile(data);
    } catch (e) {
      return null;
    }
  },

  async create(user: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      const newUser = {
        ...user,
        id: `user-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as User;
      mockUsers.unshift(newUser);
      syncUsers();
      return newUser;
    }
    // Supabase creation via Admin API is complex, usually handled via auth.signUp
    return null;
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index > -1) {
        mockUsers.splice(index, 1);
        syncUsers();
        return true;
      }
      return false;
    }
    const { error } = await (supabase as any).from('profiles').delete().eq('id', id);
    return !error;
  },

  async updateRole(id: string, role: string): Promise<User | null> {
    return this.update(id, { role: role as User['role'] });
  },
};

// ============================================
// ACTIVITY LOGS SERVICE
// ============================================

export const activityLogsService = {
  async getRecent(limit: number = 10): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured()) {
      return mockActivityLogs.slice(0, limit);
    }

    const { data, error } = await (supabase as any)
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return mockActivityLogs.slice(0, limit);
    }

    return (data || []).map(transformActivityLog);
  },

  async create(action: string, details?: string): Promise<ActivityLog | null> {
    if (!isSupabaseConfigured()) {
      const newLog = {
        id: `log-${Date.now()}`,
        userId: 'user-1',
        userName: 'System',
        action,
        details,
        createdAt: new Date().toISOString(),
      } as ActivityLog;
      mockActivityLogs.unshift(newLog);
      syncActivity();
      return newLog;
    }

    const { data: sessionData } = await (supabase as any).auth.getSession();
    const userId = sessionData?.session?.user?.id;
    const userName = sessionData?.session?.user?.email?.split('@')[0] || 'System';

    const { data, error } = await (supabase as any)
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_name: userName,
        action,
        details,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity log:', error);
      return null;
    }

    return transformActivityLog(data);
  },
};

// ============================================
// STORE SETTINGS SERVICE
// ============================================

export const storeSettingsService = {
  async get(): Promise<StoreSettings | null> {
    const cached = getFromCache('settings_main');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return mockStoreSettings as StoreSettings;
    }

    const fetchPromise = (supabase as any)
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error || !data) {
        return mockStoreSettings as StoreSettings;
      }

      const transformed = {
        id: data.id || 'settings_main',
        name: data.name || mockStoreSettings.name,
        logo: data.logo || mockStoreSettings.logo,
        currency: data.currency || mockStoreSettings.currency,
        socialLinks: data.social_links || mockStoreSettings.socialLinks,
        isMaintenanceMode: data.is_maintenance_mode ?? false,
      };
      
      // Keep local mock updated perfectly
      Object.assign(mockStoreSettings, transformed);
      syncSettings();
      
      return transformed;
    } catch (e) {
      return mockStoreSettings as StoreSettings;
    }
  },

  async update(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
    if (!isSupabaseConfigured()) {
      Object.assign(mockStoreSettings, settings);
      syncSettings();
      return mockStoreSettings as StoreSettings;
    }

    const fetchPromise = (supabase as any)
      .from('store_settings')
      .upsert({
        id: settings.id || 'settings_main',
        name: settings.name,
        logo: settings.logo,
        currency: settings.currency,
        social_links: settings.socialLinks,
        is_maintenance_mode: settings.isMaintenanceMode,
      })
      .select()
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      if (error || !data) {
        console.error('Error updating store settings:', error);
        // Fallback to local
        Object.assign(mockStoreSettings, settings);
        syncSettings();
        return mockStoreSettings as StoreSettings;
      }
      const transformed = {
        id: data.id,
        name: data.name,
        logo: data.logo || '',
        currency: data.currency,
        socialLinks: data.social_links || {},
      };
      // Always forcibly update local cache and storage even on success
      Object.assign(mockStoreSettings, transformed);
      syncSettings();
      
      return transformed;
    } catch (e) {
      console.error('Exception updating settings:', e);
      // Fallback to local
      Object.assign(mockStoreSettings, settings);
      syncSettings();
      return mockStoreSettings as StoreSettings;
    }
  },
};

// ============================================
// STATISTICS SERVICE
// ============================================

export const statisticsService = {
  async get(): Promise<Statistics> {
    const cached = getFromCache('statistics_main');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      const products = mockProducts;
      const orders = mockOrders;
      const users = mockUsers;

      return {
        totalProducts: products.length,
        totalOrders: orders.length,
        todayOrders: orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length,
        weekOrders: orders.filter(o => {
          const date = new Date(o.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return date >= weekAgo;
        }).length,
        monthOrders: orders.filter(o => {
          const date = new Date(o.createdAt);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return date >= monthAgo;
        }).length,
        totalCustomers: users.filter(u => u.role === 'customer').length,
        totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
        topProducts: [],
        recentActivities: mockActivityLogs.slice(0, 5),
      };
    }

    const fetchPromise = (supabase as any)
      .from('statistics')
      .select('*')
      .limit(1)
      .single();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );

    try {
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching statistics:', error);
        return {
          totalProducts: 0,
          totalOrders: 0,
          todayOrders: 0,
          weekOrders: 0,
          monthOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          topProducts: [],
          recentActivities: [],
        };
      }

      const recentActivities = await activityLogsService.getRecent(5);

      if (!data) {
        return {
          totalProducts: 0,
          totalOrders: 0,
          todayOrders: 0,
          weekOrders: 0,
          monthOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          topProducts: [],
          recentActivities,
        };
      }

      const transformed = {
        totalProducts: data.total_products || 0,
        totalOrders: data.total_orders || 0,
        todayOrders: data.today_orders || 0,
        weekOrders: data.week_orders || 0,
        monthOrders: data.month_orders || 0,
        totalCustomers: data.total_customers || 0,
        totalRevenue: data.total_revenue || 0,
        topProducts: [],
        recentActivities,
      };

      setToCache('statistics_main', transformed);
      return transformed;
    } catch (e) {
      return {
        totalProducts: 0,
        totalOrders: 0,
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        topProducts: [],
        recentActivities: [],
      };
    }
  },
};

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

function transformProduct(row: ProductRow): Product {
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

function transformProductToDb(product: Partial<Product>): Record<string, unknown> {
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

function transformCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    parentId: row.parent_id || undefined,
    order: row.order,
  };
}

function transformCity(row: CityRow): City {
  return {
    id: row.id,
    name: row.name,
    shippingCost: row.shipping_cost,
    isActive: row.is_active,
  };
}

function transformCurrency(row: CurrencyRow): Currency {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    exchangeRate: row.exchange_rate,
    symbol: row.symbol,
  };
}

function transformOrder(row: OrderRow): Order {
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

function transformAd(row: AdRow): Ad {
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

function transformProfile(row: ProfileRow): User {
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

function transformActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || '',
    userName: (row.user_name as string) || '',
    action: row.action as string,
    details: row.details as string | undefined,
    createdAt: row.created_at as string,
  };
}
