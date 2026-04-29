// User Types
export type UserRole = 'admin' | 'editor' | 'viewer' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Product Types
export interface ProductSize {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
  measurements?: string; // e.g. "كتف: 44.5 cm, قياس الصدر: 104 cm"
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  stock: number;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: ProductImage[];
  sizes: ProductSize[];
  colors: ProductColor[];
  stock: number;
  isVisible: boolean;
  compareAtPrice?: number;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  order: number;
  whatsappNumber?: string;
}

// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size?: ProductSize;
  color?: ProductColor;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

// Order Types
export type OrderStatus = 'pending' | 'waiting_payment' | 'paid' | 'approved' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  sourceUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerId?: string;
  city: string;
  address?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// City & Shipping Types
export interface City {
  id: string;
  name: string;
  shippingCost: number;
  isActive: boolean;
}

// Currency Types
export interface Currency {
  id: string;
  code: string;
  name: string;
  exchangeRate: number;
  symbol: string;
}

// Ad Types
export type AdType = 'image' | 'video' | 'text';
export type AdPosition = 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup';

export interface Ad {
  id: string;
  title: string;
  type: AdType;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  position: AdPosition;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  order: number;
  createdAt: string;
}

// Social Media Types
export interface SocialLinks {
  whatsapp: string;
  whatsappCategory?: Record<string, string>;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  email?: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: string;
}

// Statistics Types
export interface Statistics {
  totalProducts: number;
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  topProducts: { id: string; name: string; sales: number }[];
  recentActivities: ActivityLog[];
}

// Store Settings
export interface StoreSettings {
  id?: string;
  name: string;
  logo: string;
  currency: string;
  socialLinks: SocialLinks;
  isMaintenanceMode?: boolean;
}
