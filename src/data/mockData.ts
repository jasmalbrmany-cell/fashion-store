// ============================================
// Mock Data - DEPRECATED
// ============================================
// This file is kept only for backward compatibility.
// All data now comes directly from Supabase.
// No mock data is used anywhere in the application.

import { Product, Category, City, Order, User, Ad, ActivityLog, Currency } from '@/types';

export const mockCategories: Category[] = [];
export const mockProducts: Product[] = [];
export const mockCities: City[] = [];
export const mockCurrencies: Currency[] = [];
export const mockUsers: User[] = [];
export const mockOrders: Order[] = [];
export const mockAds: Ad[] = [];
export const mockActivityLogs: ActivityLog[] = [];

export const mockStoreSettings = {
  name: 'فاشن هاب',
  logo: '',
  currency: 'YER',
  socialLinks: {
    whatsapp: '967777123456',
    whatsappCategory: {},
    facebook: '',
    instagram: '',
    tiktok: '',
    email: '',
  },
};
