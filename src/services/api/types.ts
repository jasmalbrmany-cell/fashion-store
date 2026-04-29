import type { Product, Category, City, Currency, Order, Ad, ActivityLog, StoreSettings, User, Statistics } from '@/types';

// Database Row Types
export interface ProductRow {
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

export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  order: number;
  whatsapp_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CityRow {
  id: string;
  name: string;
  shipping_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrencyRow {
  id: string;
  code: string;
  name: string;
  exchange_rate: number;
  symbol: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
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

export interface AdRow {
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

export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'editor' | 'viewer' | 'customer';
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapingRule {
  id?: string;
  domain: string;
  name_selector?: string;
  price_selector?: string;
  image_selector?: string;
  description_selector?: string;
  sizes_selector?: string;
  active: boolean;
  created_at?: string;
}
