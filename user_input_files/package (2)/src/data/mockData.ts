import { Product, Category, City, Order, User, Ad, ActivityLog, Currency } from '@/types';

// Categories
export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'ملابس نسائية', icon: 'Shirt', order: 1 },
  { id: 'cat-2', name: 'ملابس رجالية', icon: 'Shirt', order: 2 },
  { id: 'cat-3', name: 'أحذية', icon: 'Footprints', order: 3 },
  { id: 'cat-4', name: 'إكسسوارات', icon: 'Watch', order: 4 },
  { id: 'cat-5', name: 'حقائب', icon: 'Briefcase', order: 5 },
  { id: 'cat-6', name: 'عطور', icon: 'Flower', order: 6 },
];

// Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'فستان سهرة طويل',
    description: 'فستان سهرة أنيق للمناسبات الخاصة، مصنوع من الحرير الطبيعي',
    price: 45000,
    categoryId: 'cat-1',
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', isPrimary: true },
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500', isPrimary: false },
    ],
    sizes: [
      { id: 'size-1', name: 'S', stock: 5, priceModifier: 0 },
      { id: 'size-2', name: 'M', stock: 8, priceModifier: 0 },
      { id: 'size-3', name: 'L', stock: 3, priceModifier: 0 },
      { id: 'size-4', name: 'XL', stock: 2, priceModifier: 500 },
    ],
    colors: [
      { id: 'color-1', name: 'أحمر', hex: '#DC2626', stock: 6 },
      { id: 'color-2', name: 'أزرق', hex: '#2563EB', stock: 5 },
      { id: 'color-3', name: 'أسود', hex: '#1F2937', stock: 7 },
    ],
    stock: 18,
    isVisible: true,
    sourceUrl: 'https://www.aliexpress.com/item/4000000000000.html',
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z',
  },
  {
    id: 'prod-2',
    name: 'بدلة رجالية كلاسيكية',
    description: 'بدلة رسمية للرجال، مثالية للمناسبات الرسمية والأعمال',
    price: 85000,
    categoryId: 'cat-2',
    images: [
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', isPrimary: true },
      { id: 'img-4', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500', isPrimary: false },
    ],
    sizes: [
      { id: 'size-5', name: '48', stock: 4, priceModifier: 0 },
      { id: 'size-6', name: '50', stock: 6, priceModifier: 0 },
      { id: 'size-7', name: '52', stock: 5, priceModifier: 0 },
      { id: 'size-8', name: '54', stock: 3, priceModifier: 1000 },
    ],
    colors: [
      { id: 'color-4', name: 'رمادي', hex: '#6B7280', stock: 8 },
      { id: 'color-5', name: 'كحلي', hex: '#1E3A5F', stock: 6 },
      { id: 'color-6', name: 'أسود', hex: '#1F2937', stock: 4 },
    ],
    stock: 18,
    isVisible: true,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-18T11:20:00Z',
  },
  {
    id: 'prod-3',
    name: 'حذاء رياضي حديث',
    description: 'حذاء رياضي مريح للرياضة واليومي، بتصميم عصري',
    price: 35000,
    categoryId: 'cat-3',
    images: [
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', isPrimary: true },
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500', isPrimary: false },
    ],
    sizes: [
      { id: 'size-9', name: '40', stock: 10, priceModifier: 0 },
      { id: 'size-10', name: '41', stock: 8, priceModifier: 0 },
      { id: 'size-11', name: '42', stock: 12, priceModifier: 0 },
      { id: 'size-12', name: '43', stock: 6, priceModifier: 0 },
      { id: 'size-13', name: '44', stock: 4, priceModifier: 500 },
    ],
    colors: [
      { id: 'color-7', name: 'أبيض', hex: '#FFFFFF', stock: 20 },
      { id: 'color-8', name: 'أسود', hex: '#1F2937', stock: 15 },
      { id: 'color-9', name: 'أحمر', hex: '#DC2626', stock: 5 },
    ],
    stock: 40,
    isVisible: true,
    sourceUrl: 'https://www.amazon.com/sneakers',
    createdAt: '2025-01-12T09:30:00Z',
    updatedAt: '2025-01-22T16:45:00Z',
  },
  {
    id: 'prod-4',
    name: 'شنطة يد فاخرة',
    description: 'شنطة يد من الجلد الطبيعي، مثالية للاستخدام اليومي',
    price: 55000,
    categoryId: 'cat-5',
    images: [
      { id: 'img-7', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', isPrimary: true },
      { id: 'img-8', url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500', isPrimary: false },
    ],
    sizes: [
      { id: 'size-14', name: 'صغير', stock: 5, priceModifier: 0 },
      { id: 'size-15', name: 'متوسط', stock: 8, priceModifier: 0 },
      { id: 'size-16', name: 'كبير', stock: 3, priceModifier: 2000 },
    ],
    colors: [
      { id: 'color-10', name: 'بني', hex: '#92400E', stock: 6 },
      { id: 'color-11', name: 'أسود', hex: '#1F2937', stock: 7 },
      { id: 'color-12', name: 'أحمر', hex: '#DC2626', stock: 3 },
    ],
    stock: 16,
    isVisible: true,
    createdAt: '2025-01-08T14:00:00Z',
    updatedAt: '2025-01-19T10:15:00Z',
  },
  {
    id: 'prod-5',
    name: 'ساعة يد ذهبية',
    description: 'ساعة يد أنيقة بذهب إستانلس، مقاومة للماء',
    price: 75000,
    categoryId: 'cat-4',
    images: [
      { id: 'img-9', url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500', isPrimary: true },
      { id: 'img-10', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', isPrimary: false },
    ],
    sizes: [
      { id: 'size-17', name: 'عادي', stock: 15, priceModifier: 0 },
    ],
    colors: [
      { id: 'color-13', name: 'ذهبي', hex: '#F59E0B', stock: 10 },
      { id: 'color-14', name: 'فضي', hex: '#9CA3AF', stock: 5 },
    ],
    stock: 15,
    isVisible: true,
    createdAt: '2025-01-05T11:30:00Z',
    updatedAt: '2025-01-21T09:00:00Z',
  },
  {
    id: 'prod-6',
    name: 'عطر أو دو تواليت',
    description: 'عطر رجالي منعش، تدوم رائحته لأكثر من 8 ساعات',
    price: 28000,
    categoryId: 'cat-6',
    images: [
      { id: 'img-11', url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', isPrimary: true },
    ],
    sizes: [
      { id: 'size-18', name: '50 مل', stock: 20, priceModifier: 0 },
      { id: 'size-19', name: '100 مل', stock: 15, priceModifier: 15000 },
    ],
    colors: [],
    stock: 35,
    isVisible: true,
    sourceUrl: 'https://www.noon.com/perfume',
    createdAt: '2025-01-03T16:00:00Z',
    updatedAt: '2025-01-20T13:30:00Z',
  },
];

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
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'ORD-2025-001',
    customerName: 'محمد عبدالله',
    customerPhone: '777123456',
    city: 'صنعاء',
    address: 'شارع الزبيري',
    items: [
      {
        id: 'oi-1',
        productId: 'prod-1',
        productName: 'فستان سهرة طويل',
        productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        size: 'M',
        color: 'أحمر',
        quantity: 1,
        price: 45000,
      },
    ],
    subtotal: 45000,
    shippingCost: 3000,
    total: 48000,
    status: 'pending',
    createdAt: '2025-04-05T10:00:00Z',
    updatedAt: '2025-04-05T10:00:00Z',
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-2025-002',
    customerName: 'سارة أحمد',
    customerPhone: '771234567',
    city: 'عدن',
    address: 'حي خورشيد',
    items: [
      {
        id: 'oi-2',
        productId: 'prod-3',
        productName: 'حذاء رياضي حديث',
        productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        size: '42',
        color: 'أبيض',
        quantity: 2,
        price: 35000,
      },
      {
        id: 'oi-3',
        productId: 'prod-6',
        productName: 'عطر أو دو تواليت',
        productImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
        size: '100 مل',
        quantity: 1,
        price: 43000,
      },
    ],
    subtotal: 113000,
    shippingCost: 5000,
    total: 118000,
    status: 'approved',
    createdAt: '2025-04-04T14:30:00Z',
    updatedAt: '2025-04-05T09:15:00Z',
  },
  {
    id: 'order-3',
    orderNumber: 'ORD-2025-003',
    customerName: 'خالد محمد',
    customerPhone: '773456789',
    city: 'تعز',
    items: [
      {
        id: 'oi-4',
        productId: 'prod-2',
        productName: 'بدلة رجالية كلاسيكية',
        productImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        size: '50',
        color: 'رمادي',
        quantity: 1,
        price: 85000,
      },
    ],
    subtotal: 85000,
    shippingCost: 4000,
    total: 89000,
    status: 'completed',
    createdAt: '2025-04-02T11:00:00Z',
    updatedAt: '2025-04-04T16:20:00Z',
  },
];

// Sample Ads
export const mockAds: Ad[] = [
  {
    id: 'ad-1',
    title: 'خصم 20% على جميع الفساتين',
    type: 'image',
    content: 'خصم 20% على جميع الفساتين النسائية',
    imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200',
    position: 'top',
    isActive: true,
    order: 1,
    createdAt: '2025-04-01T00:00:00Z',
  },
  {
    id: 'ad-2',
    title: 'عروض رمضان',
    type: 'image',
    content: 'عروض خاصة بمناسبة رمضان',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200',
    position: 'bottom',
    isActive: true,
    order: 2,
    createdAt: '2025-04-01T00:00:00Z',
  },
];

// Activity Logs
export const mockActivityLogs: ActivityLog[] = [
  { id: 'log-1', userId: 'user-1', userName: 'أحمد محمد', action: 'إضافة منتج جديد', details: 'فستان سهرة طويل', createdAt: '2025-04-05T10:30:00Z' },
  { id: 'log-2', userId: 'user-2', userName: 'فاطمة علي', action: 'تعديل سعر منتج', details: 'حذاء رياضي حديث - من 30000 إلى 35000', createdAt: '2025-04-05T09:15:00Z' },
  { id: 'log-3', userId: 'user-1', userName: 'أحمد محمد', action: 'موافقة على طلب', details: 'ORD-2025-002', createdAt: '2025-04-05T09:00:00Z' },
  { id: 'log-4', userId: 'user-2', userName: 'فاطمة علي', action: 'استيراد منتج', details: 'من AliExpress', createdAt: '2025-04-04T16:45:00Z' },
  { id: 'log-5', userId: 'user-1', userName: 'أحمد محمد', action: 'إضافة إعلان', details: 'عروض رمضان', createdAt: '2025-04-04T14:00:00Z' },
];

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
    },
    facebook: 'https://facebook.com/fashionhub',
    instagram: 'https://instagram.com/fashionhub',
    tiktok: 'https://tiktok.com/@fashionhub',
    email: 'info@fashionhub.com',
    website: 'https://fashionhub.com',
  },
};
