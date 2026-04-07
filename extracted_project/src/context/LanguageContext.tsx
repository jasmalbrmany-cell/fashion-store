import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface Translations {
  // الهيدر
  contactUs: string;
  trackOrder: string;
  searchPlaceholder: string;
  dashboard: string;
  store: string;
  favorites: string;
  cart: string;
  myAccount: string;
  allProducts: string;
  womenClothes: string;
  menClothes: string;
  shoes: string;
  accessories: string;
  bags: string;
  perfumes: string;
  myOrders: string;
  logout: string;

  // السلة
  cartTitle: string;
  emptyCart: string;
  loginToSeeCart: string;
  loginRegister: string;
  shopByCategory: string;
  youMightLike: string;
  mostSold: string;
  topRated: string;
  all: string;
  orderSummary: string;
  products: string;
  shipping: string;
  calculatedAtCheckout: string;
  total: string;
  completeOrder: string;
  whatsappOrder: string;
  emptyCartNote: string;
  continueShopping: string;
  size: string;
  color: string;
  pricePerItem: string;

  // صفحة المنتج
  addToCart: string;
  inStock: string;
  outOfStock: string;
  description: string;
  selectSize: string;
  selectColor: string;

  // تسجيل الدخول
  loginTitle: string;
  loginWelcome: string;
  email: string;
  password: string;
  loginButton: string;
  loading: string;
  backToStore: string;
  invalidCredentials: string;
  enterEmail: string;
  enterPassword: string;

  // لوحة التحكم
  addProduct: string;
  importFromUrl: string;
  productName: string;
  productDescription: string;
  price: string;
  category: string;
  stockQuantity: string;
  sourceUrl: string;
  visible: string;
  hidden: string;
  productImages: string;
  sizes: string;
  colors: string;
  addSize: string;
  addColor: string;
  saveProduct: string;
  cancel: string;

  // لوحة التحكم الأساسية
  adminDashboard: string;
  adminProducts: string;
  adminOrders: string;
  adminUsers: string;
  adminCities: string;
  adminCurrencies: string;
  adminAds: string;
  adminActivity: string;
  adminSettings: string;
  adminRole: string;
  editorRole: string;
  viewerRole: string;
  
  // شاشة Dashboard
  overview: string;
  totalProducts: string;
  totalOrders: string;
  todayOrders: string;
  totalRevenue: string;
  registeredCustomers: string;
  recentActivities: string;
  latestOrders: string;
  noActivitiesYet: string;
  noOrdersYet: string;

  // عام
  currency: string;
  rial: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    contactUs: 'تواصل معنا',
    trackOrder: 'تتبع طلبك',
    searchPlaceholder: 'ابحث عن منتجات...',
    dashboard: 'لوحة التحكم',
    store: 'المتجر',
    favorites: 'المفضلة',
    cart: 'السلة',
    myAccount: 'حسابي',
    allProducts: 'جميع المنتجات',
    womenClothes: 'ملابس نسائية',
    menClothes: 'ملابس رجالية',
    shoes: 'أحذية',
    accessories: 'إكسسوارات',
    bags: 'حقائب',
    perfumes: 'عطور',
    myOrders: 'طلباتي',
    logout: 'تسجيل الخروج',

    cartTitle: 'حقيبة التسوق',
    emptyCart: 'عربة التسوق فارغة',
    loginToSeeCart: 'تسجيل الدخول لرؤية عربة التسوق',
    loginRegister: 'حسابي / تسجيل',
    shopByCategory: 'تسوق حسب الفئات',
    youMightLike: 'قد يعجبك أيضاً',
    mostSold: 'الأكثر مبيعاً',
    topRated: 'الأفضل تقييماً',
    all: 'الكل',
    orderSummary: 'ملخص الطلب',
    products: 'المنتجات',
    shipping: 'الشحن',
    calculatedAtCheckout: 'يُحسب عند الإتمام',
    total: 'الإجمالي',
    completeOrder: 'إتمام الطلب',
    whatsappOrder: 'طلب عبر واتساب',
    emptyCartNote: 'لم تضف أي منتجات للسلة بعد',
    continueShopping: 'متابعة التسوق',
    size: 'المقاس',
    color: 'اللون',
    pricePerItem: 'للواحد',

    addToCart: 'أضف للسلة',
    inStock: 'متوفر',
    outOfStock: 'نفذ المخزون',
    description: 'الوصف',
    selectSize: 'اختر المقاس',
    selectColor: 'اختر اللون',

    loginTitle: 'تسجيل الدخول',
    loginWelcome: 'مرحباً بعودتك! سجل دخولك للمتابعة',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    loading: 'جاري التحميل...',
    backToStore: 'العودة للمتجر',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    enterEmail: 'يرجى إدخال البريد الإلكتروني',
    enterPassword: 'يرجى إدخال كلمة المرور',

    addProduct: 'إضافة منتج',
    importFromUrl: 'استيراد من رابط',
    productName: 'اسم المنتج',
    productDescription: 'الوصف',
    price: 'السعر',
    category: 'القسم',
    stockQuantity: 'الكمية في المخزون',
    sourceUrl: 'رابط المصدر (اختياري)',
    visible: 'ظاهر للعملاء',
    hidden: 'مخفي من العملاء',
    productImages: 'صور المنتج',
    sizes: 'المقاسات',
    colors: 'الألوان',
    addSize: 'إضافة مقاس',
    addColor: 'إضافة لون',
    saveProduct: 'حفظ المنتج',
    cancel: 'إلغاء',

    adminDashboard: 'لوحة التحكم',
    adminProducts: 'المنتجات',
    adminOrders: 'الطلبات',
    adminUsers: 'المستخدمين',
    adminCities: 'المدن والشحن',
    adminCurrencies: 'العملات',
    adminAds: 'الإعلانات',
    adminActivity: 'سجل النشاطات',
    adminSettings: 'الإعدادات',
    adminRole: 'مدير',
    editorRole: 'محرر',
    viewerRole: 'مشاهد',

    overview: 'نظرة عامة',
    totalProducts: 'إجمالي المنتجات',
    totalOrders: 'إجمالي الطلبات',
    todayOrders: 'طلبات اليوم',
    totalRevenue: 'إجمالي الإيرادات',
    registeredCustomers: 'العملاء المسجلين',
    recentActivities: 'النشاطات الأخيرة',
    latestOrders: 'أحدث الطلبات',
    noActivitiesYet: 'لم يتم تسجيل أي نشاطات بعد',
    noOrdersYet: 'لا توجد طلبات جديدة',

    currency: 'YER',
    rial: 'ر.ي',
  },
  en: {
    contactUs: 'Contact Us',
    trackOrder: 'Track Order',
    searchPlaceholder: 'Search products...',
    dashboard: 'Dashboard',
    store: 'Store',
    favorites: 'Favorites',
    cart: 'Cart',
    myAccount: 'My Account',
    allProducts: 'All Products',
    womenClothes: "Women's Clothes",
    menClothes: "Men's Clothes",
    shoes: 'Shoes',
    accessories: 'Accessories',
    bags: 'Bags',
    perfumes: 'Perfumes',
    myOrders: 'My Orders',
    logout: 'Logout',

    cartTitle: 'Shopping Cart',
    emptyCart: 'Your Cart is Empty',
    loginToSeeCart: 'Login to view your shopping cart',
    loginRegister: 'Login / Register',
    shopByCategory: 'Shop by Category',
    youMightLike: 'You Might Also Like',
    mostSold: 'Best Sellers',
    topRated: 'Top Rated',
    all: 'All',
    orderSummary: 'Order Summary',
    products: 'Products',
    shipping: 'Shipping',
    calculatedAtCheckout: 'Calculated at checkout',
    total: 'Total',
    completeOrder: 'Complete Order',
    whatsappOrder: 'Order via WhatsApp',
    emptyCartNote: 'You have not added any products yet',
    continueShopping: 'Continue Shopping',
    size: 'Size',
    color: 'Color',
    pricePerItem: 'each',

    addToCart: 'Add to Cart',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    description: 'Description',
    selectSize: 'Select Size',
    selectColor: 'Select Color',

    loginTitle: 'Sign In',
    loginWelcome: 'Welcome back! Sign in to continue',
    email: 'Email Address',
    password: 'Password',
    loginButton: 'Sign In',
    loading: 'Loading...',
    backToStore: 'Back to Store',
    invalidCredentials: 'Invalid email or password',
    enterEmail: 'Please enter your email',
    enterPassword: 'Please enter your password',

    addProduct: 'Add Product',
    importFromUrl: 'Import from URL',
    productName: 'Product Name',
    productDescription: 'Description',
    price: 'Price',
    category: 'Category',
    stockQuantity: 'Stock Quantity',
    sourceUrl: 'Source URL (optional)',
    visible: 'Visible to customers',
    hidden: 'Hidden from customers',
    productImages: 'Product Images',
    sizes: 'Sizes',
    colors: 'Colors',
    addSize: 'Add Size',
    addColor: 'Add Color',
    saveProduct: 'Save Product',
    cancel: 'Cancel',

    adminDashboard: 'Dashboard',
    adminProducts: 'Products',
    adminOrders: 'Orders',
    adminUsers: 'Users',
    adminCities: 'Cities & Shipping',
    adminCurrencies: 'Currencies',
    adminAds: 'Advertisements',
    adminActivity: 'Activity Logs',
    adminSettings: 'Settings',
    adminRole: 'Admin',
    editorRole: 'Editor',
    viewerRole: 'Viewer',

    overview: 'Overview',
    totalProducts: 'Total Products',
    totalOrders: 'Total Orders',
    todayOrders: 'Today\'s Orders',
    totalRevenue: 'Total Revenue',
    registeredCustomers: 'Registered Customers',
    recentActivities: 'Recent Activities',
    latestOrders: 'Latest Orders',
    noActivitiesYet: 'No activities yet',
    noOrdersYet: 'No recent orders',

    currency: 'YER',
    rial: 'YER',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('fashionHubLang') as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('fashionHubLang', lang);
    // تغيير اتجاه الصفحة
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        isRTL: language === 'ar',
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
