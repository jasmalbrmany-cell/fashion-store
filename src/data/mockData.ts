import { Product, Category, City, Order, User, Ad, ActivityLog, Currency } from '@/types';

// Categories
export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'ملابس نسائية', icon: 'Shirt', order: 1 },
  { id: 'cat-2', name: 'ملابس رجالية', icon: 'Shirt', order: 2 },
  { id: 'cat-3', name: 'أحذية', icon: 'Footprints', order: 3 },
  { id: 'cat-4', name: 'إكسسوارات', icon: 'Watch', order: 4 },
  { id: 'cat-5', name: 'حقائب', icon: 'Briefcase', order: 5 },
  { id: 'cat-6', name: 'عطور', icon: 'Flower', order: 6 },
  { id: 'cat-7', name: 'ملابس أطفال', icon: 'Baby', order: 7 },
];

// Products
export const mockProducts: Product[] = [];

// Cities with shipping costs
export const mockCities: City[] = [
  { id: 'city-1', name: 'صنعاء', shippingCost: 3000, isActive: true },
  { id: 'city-2', name: 'عدن', shippingCost: 5000, isActive: true },
  { id: 'city-3', name: 'تعز', shippingCost: 4000, isActive: true },
  { id: 'city-4', name: 'الحديدة', shippingCost: 4500, isActive: true },
  { id: 'city-5', name: 'حضرموت', shippingCost: 6000, isActive: true },
];

// Currency settings
export const mockCurrencies: Currency[] = [
  { id: 'cur-1', code: 'YER', name: 'ريال يمني', exchangeRate: 1, symbol: 'ر.ي' },
  { id: 'cur-2', code: 'SAR', name: 'ريال سعودي', exchangeRate: 0.075, symbol: 'ر.س' },
  { id: 'cur-3', code: 'USD', name: 'دولار أمريكي', exchangeRate: 0.004, symbol: '$' },
];

// Users
export const mockUsers: User[] = [
  { id: 'user-1', email: 'admin@fashionhub.com', name: 'أحمد محمد', phone: '777123456', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-2', email: 'editor@fashionhub.com', name: 'فاطمة علي', phone: '777654321', role: 'editor', created_at: '2024-02-15T00:00:00Z' },
  { id: 'user-3', email: 'viewer@fashionhub.com', name: 'محمد خالد', phone: '777987654', role: 'viewer', created_at: '2024-03-20T00:00:00Z' },
];

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
