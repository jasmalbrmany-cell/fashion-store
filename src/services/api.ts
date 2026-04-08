import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Product, Category, City, Currency, Order, Ad, ActivityLog, StoreSettings, User, Statistics } from '@/types';
import { mockProducts, mockCategories, mockCities, mockCurrencies, mockOrders, mockAds, mockActivityLogs, mockStoreSettings, mockUsers } from '@/data/mockData';

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
    if (!isSupabaseConfigured()) {
      return mockProducts.filter(p => p.isVisible);
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return mockProducts.filter(p => p.isVisible);
    }

    return (data || []).map(transformProduct);
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return mockProducts.filter(p => p.categoryId === categoryId && p.isVisible);
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products by category:', error);
      return mockProducts.filter(p => p.categoryId === categoryId && p.isVisible);
    }

    return (data || []).map(transformProduct);
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
    if (!isSupabaseConfigured()) {
      return mockProducts;
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin products:', error);
      return mockProducts;
    }

    return (data || []).map(transformProduct);
  },

  async create(product: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const newProduct = { ...product, id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product;
      mockProducts.push(newProduct);
      return newProduct;
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .insert(transformProductToDb(product))
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return null;
    }

    return transformProduct(data);
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
        mockProducts[index] = { ...mockProducts[index], ...updates, updatedAt: new Date().toISOString() };
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
      return null;
    }

    return transformProduct(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockProducts.findIndex(p => p.id === id);
      if (index > -1) {
        mockProducts.splice(index, 1);
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
    if (!isSupabaseConfigured()) {
      return mockCategories;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return mockCategories;
    }

    return (data || []).map(transformCategory);
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

    return transformCategory(data);
  },

  async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCategories.findIndex(c => c.id === id);
      if (index > -1) {
        mockCategories[index] = { ...mockCategories[index], ...updates };
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

    return transformCategory(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCategories.findIndex(c => c.id === id);
      if (index > -1) {
        mockCategories.splice(index, 1);
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

    return true;
  },
};

// ============================================
// CITIES SERVICE
// ============================================

export const citiesService = {
  async getAll(): Promise<City[]> {
    if (!isSupabaseConfigured()) {
      return mockCities;
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching cities:', error);
      return mockCities;
    }

    return (data || []).map(transformCity);
  },

  async getActive(): Promise<City[]> {
    if (!isSupabaseConfigured()) {
      return mockCities.filter(c => c.isActive);
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active cities:', error);
      return mockCities.filter(c => c.isActive);
    }

    return (data || []).map(transformCity);
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
      return null;
    }

    return transformCity(data);
  },

  async update(id: string, updates: Partial<City>): Promise<City | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCities.findIndex(c => c.id === id);
      if (index > -1) {
        mockCities[index] = { ...mockCities[index], ...updates };
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
      return null;
    }

    return transformCity(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCities.findIndex(c => c.id === id);
      if (index > -1) {
        mockCities.splice(index, 1);
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
      return false;
    }

    return true;
  },
};

// ============================================
// CURRENCIES SERVICE
// ============================================

export const currenciesService = {
  async getAll(): Promise<Currency[]> {
    if (!isSupabaseConfigured()) {
      return mockCurrencies;
    }

    const { data, error } = await (supabase as any)
      .from('currencies')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.error('Error fetching currencies:', error);
      return mockCurrencies;
    }

    return (data || []).map(transformCurrency);
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
      return newCurrency;
    }

    const { data, error } = await (supabase as any)
      .from('currencies')
      .insert({
        code: currency.code || '',
        name: currency.name || '',
        exchange_rate: currency.exchangeRate || 1,
        symbol: currency.symbol || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating currency:', error);
      return null;
    }

    return transformCurrency(data);
  },

  async update(id: string, updates: Partial<Currency>): Promise<Currency | null> {
    if (!isSupabaseConfigured()) {
      const index = mockCurrencies.findIndex(c => c.id === id);
      if (index > -1) {
        mockCurrencies[index] = { ...mockCurrencies[index], ...updates };
        return mockCurrencies[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
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

    if (error) {
      console.error('Error updating currency:', error);
      return null;
    }

    return transformCurrency(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockCurrencies.findIndex(c => c.id === id);
      if (index > -1) {
        mockCurrencies.splice(index, 1);
        return true;
      }
      return false;
    }

    const { error } = await (supabase as any)
      .from('currencies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting currency:', error);
      return false;
    }

    return true;
  },
};

// ============================================
// ORDERS SERVICE
// ============================================

export const ordersService = {
  async getAll(): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return mockOrders;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return mockOrders;
    }

    return (data || []).map(transformOrder);
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
        return mockOrders[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return null;
    }

    return transformOrder(data);
  },

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      const index = mockOrders.findIndex(o => o.id === id);
      if (index > -1) {
        mockOrders[index] = { ...mockOrders[index], ...updates, updatedAt: new Date().toISOString() };
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
    if (!isSupabaseConfigured()) {
      return mockAds.filter(a => a.isActive);
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching active ads:', error);
      return mockAds.filter(a => a.isActive);
    }

    return (data || []).map(transformAd);
  },

  async getAll(): Promise<Ad[]> {
    if (!isSupabaseConfigured()) {
      return mockAds;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching ads:', error);
      return mockAds;
    }

    return (data || []).map(transformAd);
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
      return null;
    }

    return transformAd(data);
  },

  async update(id: string, updates: Partial<Ad>): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      const index = mockAds.findIndex(a => a.id === id);
      if (index > -1) {
        mockAds[index] = { ...mockAds[index], ...updates };
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
      return null;
    }

    return transformAd(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const index = mockAds.findIndex(a => a.id === id);
      if (index > -1) {
        mockAds.splice(index, 1);
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
    if (!isSupabaseConfigured()) {
      return mockUsers;
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return mockUsers;
    }

    return (data || []).map(transformProfile);
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
        return mockUsers[index];
      }
      return null;
    }

    const { data, error } = await (supabase as any)
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

    if (error) {
      console.error('Error updating user:', error);
      return null;
    }

    return transformProfile(data);
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
    if (!isSupabaseConfigured()) {
      return mockStoreSettings as StoreSettings;
    }

    const { data, error } = await (supabase as any)
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching store settings:', error);
      return mockStoreSettings as StoreSettings;
    }

    if (!data) {
      return mockStoreSettings as StoreSettings;
    }

    return {
      name: data.name,
      logo: data.logo || '',
      currency: data.currency,
      socialLinks: data.social_links || {},
    };
  },

  async update(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
    if (!isSupabaseConfigured()) {
      Object.assign(mockStoreSettings, settings);
      return mockStoreSettings as StoreSettings;
    }

    const { data, error } = await (supabase as any)
      .from('store_settings')
      .update({
        name: settings.name,
        logo: settings.logo,
        currency: settings.currency,
        social_links: settings.socialLinks,
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating store settings:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      name: data.name,
      logo: data.logo || '',
      currency: data.currency,
      socialLinks: data.social_links || {},
    };
  },
};

// ============================================
// STATISTICS SERVICE
// ============================================

export const statisticsService = {
  async get(): Promise<Statistics> {
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

    const { data, error } = await (supabase as any)
      .from('statistics')
      .select('*')
      .limit(1)
      .single();

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
        recentActivities: [],
      };
    }

    return {
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
