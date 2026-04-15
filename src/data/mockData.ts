import { Product, Category, City, Order, User, Ad, ActivityLog, Currency } from '@/types';

// Categories
export const mockCategories: Category[] = [];

// Products
export const mockProducts: Product[] = [];

// Cities with shipping costs
export const mockCities: City[] = [];

// Currency settings
export const mockCurrencies: Currency[] = [];

// Users
export const mockUsers: User[] = [];

// Sample Orders
export const mockOrders: Order[] = [];

// Sample Ads
export const mockAds: Ad[] = [];

// Activity Logs
export const mockActivityLogs: ActivityLog[] = [];

// Store Settings
export const mockStoreSettings = {
  name: 'فاشن هاب',
  logo: 'https://via.placeholder.com/150x50?text=FashionHub',
  currency: 'YER',
  socialLinks: {
    whatsapp: '967777123456',
    whatsappCategory: {
      'cat-1': '967777111111',
      'cat-2': '967777222222',
      'cat-3': '967777333333',
      'cat-7': '967777777777',
    },
    facebook: 'https://facebook.com/fashionhub',
    instagram: 'https://instagram.com/fashionhub',
    tiktok: 'https://tiktok.com/@fashionhub',
    email: 'info@fashionhub.com',
    website: 'https://fashionhub.com',
  },
};
