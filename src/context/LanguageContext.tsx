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
  productNotFound: string;
  home: string;
  imported: string;
  reviews: string;
  quantityLabel: string;
  itemsInStock: string;
  outOfOrder: string;
  buyNow: string;
  inCart: string;
  source: string;
  additionalDetails: string;
  categoryLabel: string;
  availableSizes: string;
  availableColors: string;
  pleaseSelectSize: string;
  pleaseSelectColor: string;

  // إتمام الطلب
  checkout: string;
  deliveryInfo: string;
  fullName: string;
  enterFullName: string;
  enterPhone: string;
  phoneValidation: string;
  chooseCity: string;
  detailedAddress: string;
  addressPlaceholder: string;
  additionalNotes: string;
  notesPlaceholder: string;
  confirmViaWhatsapp: string;
  sending: string;
  whatsappOrderTemplate: string;
  newOrder: string;
  customerInfo: string;
  paymentSummaryLabel: string;
  willContactYou: string;
  emptyCartCheckout: string;

  // نجاح الطلب
  orderSuccessTitle: string;
  thankYou: string;
  orderSuccessDesc: string;
  whatsappConversationOpened: string;
  completePaymentInWhatsapp: string;
  nextSteps: string;
  reviewOrder: string;
  contactConfirmAndPay: string;
  shipSoon: string;

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

  // الصفحات الداخلية المنتجات
  productCount: string;
  allCategories: string;
  moreFilters: string;
  dateAdded: string;
  status: string;
  actions: string;
  // source: string; // Removed duplicate
  units: string;
  show: string;
  viewProduct: string;
  edit: string;
  delete: string;
  noProducts: string;
  confirmDeleteProduct: string;

  // الصفحات الداخلية الطلبات
  ordersCount: string;
  searchOrders: string;
  searchProducts: string;
  allStatuses: string;
  orderNumber: string;
  customer: string;
  date: string;
  orderDetails: string;
  contactWhatsApp: string;
  generateInvoice: string;
  downloadInvoice: string;
  contactCustomer: string;
  // customerInfo: string; // Removed duplicate
  address: string;
  subtotal: string;
  shippingCost: string;
  orderTotal: string;

  // عام
  currency: string;
  rial: string;
  name: string;
  phone: string;
  city: string;
  quantity: string;
  search: string;

  // الصفحة الرئيسية
  shopNow: string;
  browseProducts: string;
  welcomeTo: string;
  latestTrends: string;
  featuredProducts: string;
  newArrivals: string;
  viewAll: string;
  categories: string;
  buyViaWhatsapp: string;
  contactNow: string;
  whatsappDesc: string;
  fastShipping: string;
  fastShippingDesc: string;
  securePay: string;
  securePayDesc: string;
  easyReturn: string;
  easyReturnDesc: string;
  support: string;
  supportDesc: string;

  // الفوتر
  footerAbout: string;
  quickLinks: string;
  footerCategories: string;
  contactInfo: string;
  trackMyOrder: string;
  allRights: string;
  madeWith: string;

  // تتبع الطلب
  trackOrderTitle: string;
  orderNotFound: string;
  orderNotFoundDesc: string;
  orderReceived: string;
  paymentConfirmed: string;
  shipped: string;
  orderDelivered: string;
  orderCancelled: string;
  enterOrderNumber: string;
  whatsappContact: string;
  orderStatus: string;
  orderTracking: string;

  // حالات الطلب
  statusPending: string;
  statusWaitingPayment: string;
  statusPaid: string;
  statusApproved: string;
  statusCompleted: string;
  statusCancelled: string;

  // حسابي
  premiumCustomer: string;
  ordersHistory: string;
  noOrdersYetDesc: string;
  backToShopping: string;
  orderNumberLabel: string;
  orderDate: string;
  paymentSummary: string;
  itemsSummary: string;
  shippingAddress: string;
  menu: string;
  bulkImport: string;
  discoverProducts: string;
  filters: string;
  clearAll: string;
  priceRange: string;
  minPrice: string;
  maxPrice: string;
  applyFilters: string;
  sortBy: string;
  sortNewest: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  sortName: string;
  tryDiffSearch: string;
  onlyLeft: string;
  clearCart: string;
  browseProducts: string;
  whatsappConfirmNote: string;
  adminCitiesTitle: string;
  addCity: string;
  editCity: string;
  cityPlaceholder: string;
  shippingCostLabel: string;
  active: string;
  inactive: string;
  saveChanges: string;
  confirmDeleteCity: string;
  noCitiesFound: string;
  inventoryManagement: string;
  totalItems: string;
  loadingInventory: string;
  addingProduct: string;
  confirmDeleteOrder: string;
  currenciesTitle: string;
  manageExchangeRates: string;
  addCurrency: string;
  editCurrency: string;
  currencyCode: string;
  currencyName: string;
  exchangeRateLabel: string;
  symbolLabel: string;
  baseCurrency: string;
  cannotDeleteBaseCurrency: string;
  confirmDeleteCurrency: string;
  noCurrenciesFound: string;
  currencyInfoNote: string;
  identitySettings: string;
  identitySettingsDesc: string;
  branding: string;
  officialStoreName: string;
  logoUrl: string;
  socialChannels: string;
  mainWhatsapp: string;
  categoryRouting: string;
  categoryRoutingDesc: string;
  savedSuccessfully: string;
  saving: string;
  adminDashboardTitle: string;
  welcomeBack: string;
  lastUpdated: string;
  totalRevenue: string;
  recentActivities: string;
  fullLog: string;
  quickActions: string;
  noRecentActivity: string;
  securePersistence: string;
  dataEncrypted: string;
  addProductShort: string;
  adminUsersTitle: string;
  totalUsersDesc: string;
  customersCount: string;
  adminsCount: string;
  addUser: string;
  editUser: string;
  fullName: string;
  emailLabel: string;
  phoneLabel: string;
  passwordLabel: string;
  roleLabel: string;
  permissionsLabel: string;
  selectAll: string;
  deselectAll: string;
  cannotDeleteSelf: string;
  cannotDeleteAdmin: string;
  confirmDeleteUser: string;
  userCreatedSuccess: string;
  userUpdatedSuccess: string;
  userDeletedSuccess: string;
  you: string;
  adminAdsTitle: string;
  adsCount: string;
  addAd: string;
  editAd: string;
  adTitle: string;
  adType: string;
  adPosition: string;
  adContent: string;
  adImageUrl: string;
  adVideoUrl: string;
  adLink: string;
  adActive: string;
  adTop: string;
  adBottom: string;
  adSidebar: string;
  adInline: string;
  adPopup: string;
  imageType: string;
  videoType: string;
  textType: string;
  adDeletedSuccess: string;
  confirmDeleteAd: string;
  activityHistory: string;
  exportReport: string;
  allUsers: string;
  searchActivities: string;
  systemAction: string;
  justNow: string;
  hoursAgo: string;
  daysAgo: string;
  totalActivities: string;
  additions: string;
  edits: string;
  deletions_count: string;
  manageProducts: string;
  availableProducts: string;
  addProduct: string;
  editProduct: string;
  importFromUrl: string;
  searchByProductName: string;
  allCategories: string;
  productName: string;
  productDescription: string;
  productPrice: string;
  productCategory: string;
  stockLabel: string;
  stockUnits: string;
  visibilityStatus: string;
  visible: string;
  hidden: string;
  productAddedSuccess: string;
  productUpdatedSuccess: string;
  productDeletedSuccess: string;
  errorSavingProduct: string;
  confirmDeleteProduct: string;
  loadingProducts: string;
  visualAssets: string;
  uploadImages: string;
  fromUrl: string;
  mainImage: string;
  sizesAndVariants: string;
  addSize: string;
  addColor: string;
  colorMapping: string;
  saveFinalProduct: string;
  addedAt: string;
  generalInfo: string;
  detailedDescription: string;
  loadingOrders: string;
  mobile: string;
  qtyLabel: string;
  approveOrder: string;
  completeOrder: string;
  waitingPayment: string;
  cancelOrder: string;
  paid: string;
  cityName: string;
  searchCity: string;
  searchCurrency: string;
  currencyNamePlaceholder: string;
  exchangeRateInfo: string;
  officialEmail: string;
  noCategories: string;
  adTitlePlaceholder: string;
  adImageUrl: string;
  adContent: string;
  adLink: string;
  adActive: string;
  adImageUrlPlaceholder: string;
  adContentPlaceholder: string;
  adLinkPlaceholder: string;
  searchUserPlaceholder: string;
  cannotDeleteSelf: string;
  cannotDeleteAdmin: string;
  userUpdatedSuccess: string;
  userCreatedSuccess: string;
  userDeletedSuccess: string;
  confirmDeleteUser: string;
  totalUsersDesc: string;
  customersCount: string;
  adminsCount: string;
  selectAll: string;
  deselectAll: string;
  you: string;
  inventoryManagement: string;
  identityManagement: string;
  fullName: string;
  emailLabel: string;
  phoneLabel: string;
  passwordLabel: string;
  roleLabel: string;
  permissionsLabel: string;
  activityHistory: string;
  exportReport: string;
  searchActivities: string;
  allUsers: string;
  justNow: string;
  hoursAgo: string;
  daysAgo: string;
  totalActivities: string;
  additions: string;
  edits: string;
  deletions_count: string;
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
    outOfStock: 'نفد المخزون',
    description: 'الوصف',
    selectSize: 'اختر المقاس',
    selectColor: 'اختر اللون',
    productNotFound: 'المنتج غير موجود',
    home: 'الرئيسية',
    imported: 'مستورد',
    reviews: 'تقييم',
    quantityLabel: 'الكمية',
    itemsInStock: 'متوفر في المخزون',
    outOfOrder: 'غير متوفر',
    buyNow: 'شراء الآن',
    inCart: 'في السلة',
    source: 'المصدر',
    additionalDetails: 'تفاصيل إضافية',
    categoryLabel: 'الفئة',
    availableSizes: 'المقاسات المتاحة',
    availableColors: 'الألوان المتاحة',
    pleaseSelectSize: 'يرجى اختيار المقاس',
    pleaseSelectColor: 'يرجى اختيار اللون',

    checkout: 'إتمام الطلب',
    deliveryInfo: 'معلومات التوصيل',
    fullName: 'الاسم الكامل',
    enterFullName: 'يرجى إدخال الاسم',
    enterPhone: 'يرجى إدخال رقم الجوال',
    phoneValidation: 'يرجى إدخال رقم جوال صحيح',
    chooseCity: 'اختر المدينة',
    detailedAddress: 'العنوان التفصيلي (اختياري)',
    addressPlaceholder: 'مثال: شارع الزبيري، بجوار المسجد',
    additionalNotes: 'ملاحظات إضافية (اختياري)',
    notesPlaceholder: 'أي ملاحظات خاصة بالطلب...',
    confirmViaWhatsapp: 'تأكيد الطلب عبر واتساب',
    sending: 'جاري الإرسال...',
    whatsappOrderTemplate: 'طلب جديد',
    newOrder: 'طلب جديد رقم',
    customerInfo: 'معلومات العميل',
    paymentSummaryLabel: 'ملخص الطلب',
    willContactYou: 'سيتم التواصل معك عبر واتساب لتأكيد طلبك واستكمال عملية الدفع',
    emptyCartCheckout: 'السلة فارغة، لا يمكنك إتمام الطلب',

    // نجاح الطلب
    orderSuccessTitle: 'تم إرسال طلبك بنجاح!',
    thankYou: 'شكراً لك',
    orderSuccessDesc: 'سيتم التواصل معك قريباً عبر واتساب',
    whatsappConversationOpened: 'تم فتح محادثة واتساب',
    completePaymentInWhatsapp: 'يرجى إكمال معلومات الدفع التي ستظهر في المحادثة مع مدير المتجر',
    nextSteps: 'الخطوات التالية',
    reviewOrder: 'سيتم مراجعة طلبك من قبل إدارة المتجر',
    contactConfirmAndPay: 'سيتم التواصل معك عبر واتساب لتأكيد الطلب والدفع',
    shipSoon: 'بعد الدفع، سيتم شحن طلبك في أقرب وقت',

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

    // الصفحات الداخلية المنتجات
    productCount: 'منتج',
    allCategories: 'جميع الأقسام',
    moreFilters: 'المزيد',
    dateAdded: 'تاريخ الإضافة',
    status: 'الحالة',
    actions: 'إجراءات',
    units: 'وحدة',
    show: 'إظهار',
    viewProduct: 'عرض المنتج',
    edit: 'تعديل',
    delete: 'حذف',
    noProducts: 'لا توجد منتجات',
    confirmDeleteProduct: 'هل أنت متأكد من حذف هذا المنتج؟',

    // الصفحات الداخلية الطلبات
    ordersCount: 'طلب',
    searchOrders: 'ابحث برقم الطلب أو اسم العميل أو الجوال...',
    searchProducts: 'ابحث عن منتج...',
    allStatuses: 'جميع الحالات',
    orderNumber: 'رقم الطلب',
    customer: 'العميل',
    date: 'التاريخ',
    orderDetails: 'تفاصيل الطلب',
    contactWhatsApp: 'تواصل واتساب',
    generateInvoice: 'إنشاء فاتورة',
    downloadInvoice: 'تحميل الفاتورة',
    contactCustomer: 'تواصل مع العميل',
    address: 'العنوان',
    subtotal: 'المجموع الفرعي',
    shippingCost: 'تكلفة الشحن',
    orderTotal: 'الإجمالي النهائي',

    currency: 'YER',
    rial: 'ر.ي',

    // الصفحة الرئيسية
    shopNow: 'تسوق الآن',
    browseProducts: 'تصفح المنتجات',
    welcomeTo: 'مرحباً بك في',
    latestTrends: 'أحدث الصيحات بأسعار منافسة',
    featuredProducts: 'المنتجات المميزة',
    newArrivals: 'وصل حديثاً',
    viewAll: 'عرض الكل',
    categories: 'الأقسام',
    buyViaWhatsapp: 'اشترِ عبر واتساب',
    contactNow: 'تواصل الآن',
    whatsappDesc: 'تسوق بسهولة وأرسل لنا طلبك مباشرة عبر واتساب',
    fastShipping: 'شحن سريع',
    fastShippingDesc: 'توصيل لجميع المدن',
    securePay: 'دفع آمن',
    securePayDesc: 'طرق دفع متعددة',
    easyReturn: 'استرجاع سهل',
    easyReturnDesc: 'ضمان استرجاع المنتج',
    support: 'دعم فني',
    supportDesc: '24/7 عبر واتساب',

    // الفوتر
    footerAbout: 'متجرك المفضل للأزياء العصرية ومتابعة أحدث الصيحات العالمية. نوفر لك أفضل المنتجات بأسعار منافسة.',
    quickLinks: 'روابط سريعة',
    footerCategories: 'الأقسام',
    contactInfo: 'تواصل معنا',
    trackMyOrder: 'تتبع طلبي',
    allRights: 'جميع الحقوق محفوظة',
    madeWith: 'صُنع بـ ❤️ في اليمن',

    // تتبع الطلب
    trackOrderTitle: 'تتبع الطلب',
    orderNotFound: 'لم يتم العثور على الطلب',
    orderNotFoundDesc: 'تأكد من صحة رقم الطلب أو رقم الجوال وحاول مرة أخرى',
    orderReceived: 'تم استلام الطلب',
    paymentConfirmed: 'تم تأكيد الدفع',
    shipped: 'تم الشحن',
    orderDelivered: 'تم التسليم',
    orderCancelled: 'تم إلغاء الطلب',
    enterOrderNumber: 'أدخل رقم الطلب أو رقم الجوال',
    whatsappContact: 'تواصل عبر واتساب',
    orderStatus: 'حالة الطلب',
    orderTracking: 'تتبع الطلب',
    name: 'الاسم',
    phone: 'رقم الجوال',
    city: 'المدينة',
    quantity: 'الكمية',
    search: 'بحث',

    // حالات الطلب
    statusPending: 'قيد الانتظار',
    statusWaitingPayment: 'بانتظار الدفع',
    statusPaid: 'تم الدفع',
    statusApproved: 'تمت الموافقة',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',

    // حسابي
    premiumCustomer: 'عميل مميز',
    ordersHistory: 'سجل طلباتي',
    noOrdersYetDesc: 'لم تقم بإجراء أي طلبات حتى الآن، تصفح المتجر واكتشف منتجاتنا!',
    backToShopping: 'العودة للتسوق',
    orderNumberLabel: 'طلب رقم',
    orderDate: 'التاريخ',
    paymentSummary: 'ملخص الدفع',
    itemsSummary: 'المنتجات',
    shippingAddress: 'عنوان التوصيل',
    menu: 'القائمة',
    bulkImport: 'استيراد متجر كامل',
    discoverProducts: 'اكتشاف المنتجات',
    filters: 'الفلاتر',
    clearAll: 'مسح الكل',
    priceRange: 'نطاق السعر',
    minPrice: 'من',
    maxPrice: 'إلى',
    applyFilters: 'تطبيق الفلاتر',
    sortBy: 'ترتيب حسب',
    sortNewest: 'الأحدث',
    sortPriceLow: 'السعر: من الأقل للأعلى',
    sortPriceHigh: 'السعر: من الأعلى للأقل',
    sortName: 'الاسم: أ-ي',
    tryDiffSearch: 'جرب تغيير الفلاتر أو البحث بكلمات مختلفة',
    onlyLeft: 'تبقى {count} فقط',
    clearCart: 'إفراغ السلة',
    browseProducts: 'تصفح المنتجات',
    whatsappConfirmNote: 'سيتم التواصل معك عبر واتساب لتأكيد الطلب',
    adminCitiesTitle: 'المدن والشحن',
    addCity: 'إضافة مدينة',
    editCity: 'تعديل مدينة',
    cityPlaceholder: 'مثال: صنعاء',
    shippingCostLabel: 'تكلفة الشحن (ريال)',
    active: 'مفعل',
    inactive: 'غير مفعل',
    saveChanges: 'حفظ التغييرات',
    confirmDeleteCity: 'هل أنت متأكد من حذف هذه المدينة؟',
    noCitiesFound: 'لا توجد مدن',
    inventoryManagement: 'إدارة المنتجات',
    totalItems: 'منتج متوفر',
    loadingInventory: 'جاري تحميل المخزون...',
    addingProduct: 'إضافة منتج',
    confirmDeleteOrder: 'هل أنت متأكد من حذف هذا الطلب؟',
    currenciesTitle: 'العملات',
    manageExchangeRates: 'إدارة أسعار الصرف',
    addCurrency: 'إضافة عملة',
    editCurrency: 'تعديل عملة',
    currencyCode: 'كود العملة',
    currencyName: 'اسم العملة',
    exchangeRateLabel: 'سعر الصرف (مقابل الريال اليمني)',
    symbolLabel: 'الرمز',
    baseCurrency: 'أساسية',
    cannotDeleteBaseCurrency: 'لا يمكن حذف العملة الأساسية',
    confirmDeleteCurrency: 'هل أنت متأكد من حذف هذه العملة؟',
    noCurrenciesFound: 'لا توجد عملات',
    currencyInfoNote: 'العملة الأساسية هي الريال اليمني (YER). جميع الأسعار في المتجر تُعرض بهذه العملة.',
    identitySettings: 'إعدادات الهوية والتواصل',
    identitySettingsDesc: 'تحكم في هوية متجرك وروابط الوصول السريع لعملائك',
    branding: 'العلامة التجارية',
    officialStoreName: 'اسم المتجر الرسمي',
    logoUrl: 'رابط الشعار (URL)',
    socialChannels: 'قنوات التواصل الإجتماعي',
    mainWhatsapp: 'رقم الواتساب الرئيسي',
    categoryRouting: 'توجيه طلبات الأقسام',
    categoryRoutingDesc: 'توجيه كل قسم لمسؤول محدد',
    savedSuccessfully: 'تم الحفظ بنجاح!',
    saving: 'جاري الحفظ...',
    adminDashboardTitle: 'لوحة التحكم',
    welcomeBack: 'مرحباً بعودتك،',
    lastUpdated: 'آخر تحديث',
    totalRevenue: 'إجمالي الإيرادات',
    recentActivities: 'الأعمال الأخيرة',
    fullLog: 'السجل الكامل',
    quickActions: 'وصول سريع',
    noRecentActivity: 'لا توجد نشاطات حديثة',
    securePersistence: 'نظام الحفظ المحمى نشط',
    dataEncrypted: 'جميع البيانات مشفرة محلياً',
    addProductShort: 'إضافة منتج',
    adminUsersTitle: 'إدارة المستخدمين',
    totalUsersDesc: 'مستخدم إجمالاً',
    customersCount: 'عميل',
    adminsCount: 'مشرف',
    addUser: 'إضافة مستخدم',
    editUser: 'تعديل المستخدم',
    fullName: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الجوال',
    passwordLabel: 'كلمة المرور',
    roleLabel: 'الدور الوظيفي',
    permissionsLabel: 'الصلاحيات المخصصة',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء الكل',
    cannotDeleteSelf: 'لا يمكنك حذف حسابك الحالي',
    cannotDeleteAdmin: 'لا يمكن حذف حساب المدير الرئيسي',
    confirmDeleteUser: 'هل أنت متأكد من حذف المستخدم؟',
    userCreatedSuccess: 'تم إنشاء المستخدم بنجاح',
    userUpdatedSuccess: 'تم تحديث المستخدم بنجاح',
    userDeletedSuccess: 'تم حذف المستخدم بنجاح',
    you: 'أنت',
    adminAdsTitle: 'إدارة الإعلانات',
    adsCount: 'إعلان',
    addAd: 'إضافة إعلان',
    editAd: 'تعديل إعلان',
    adTitle: 'عنوان الإعلان',
    adType: 'النوع',
    adPosition: 'مكان الظهور',
    adContent: 'المحتوى النصي',
    adImageUrl: 'رابط الصورة',
    adVideoUrl: 'رابط الفيديو',
    adLink: 'رابط التوجيه (اختياري)',
    adActive: 'مفعل',
    adTop: 'أعلى الصفحة',
    adBottom: 'أسفل الصفحة',
    adSidebar: 'جانبي',
    adInline: 'داخل الأقسام',
    adPopup: 'نافذة منبثقة',
    imageType: 'صورة',
    videoType: 'فيديو',
    textType: 'نص',
    adDeletedSuccess: 'تم حذف الإعلان بنجاح',
    confirmDeleteAd: 'هل أنت متأكد من حذف هذا الإعلان؟',
    activityHistory: 'سجل النشاطات',
    exportReport: 'تصدير التقرير',
    allUsers: 'جميع المستخدمين',
    searchActivities: 'ابحث في النشاطات...',
    systemAction: 'النظام',
    justNow: 'الآن',
    hoursAgo: 'ساعة',
    daysAgo: 'يوم',
    totalActivities: 'إجمالي النشاطات',
    additions: 'إضافات',
    edits: 'تعديلات',
    deletions_count: 'حذف',
    manageProducts: 'إدارة المنتجات',
    availableProducts: 'منتج متوفر',
    addProduct: 'إضافة منتج',
    editProduct: 'تعديل المنتج',
    importFromUrl: 'استيراد من رابط',
    searchByProductName: 'ابحث باسم المنتج...',
    allCategories: 'جميع الأقسام',
    productName: 'اسم المنتج',
    productDescription: 'الوصف التفصيلي',
    productPrice: 'السعر',
    productCategory: 'القسم',
    stockLabel: 'المخزون',
    stockUnits: 'قطعة',
    visibilityStatus: 'الحالة',
    visible: 'ظاهر',
    hidden: 'مخفي',
    productAddedSuccess: 'تم إضافة المنتج بنجاح!',
    productUpdatedSuccess: 'تم تحديث المنتج بنجاح!',
    productDeletedSuccess: 'تم حذف المنتج بنجاح!',
    errorSavingProduct: 'حدث خطأ أثناء حفظ المنتج',
    confirmDeleteProduct: 'هل أنت متأكد من حذف هذا المنتج؟',
    loadingProducts: 'جاري تحميل المنتجات...',
    visualAssets: 'معرض الصور',
    uploadImages: 'رفع صور',
    fromUrl: 'رابط URL',
    mainImage: 'أساسي',
    sizesAndVariants: 'المقاسات والألوان',
    addSize: '+ إضافة مقاس',
    addColor: '+ إضافة لون',
    colorMapping: 'ترتيب الألوان',
    saveFinalProduct: 'حفظ المنتج النهائي',
    addedAt: 'تم الإضافة:',
    generalInfo: 'البيانات الأساسية',
    detailedDescription: 'الوصف التفصيلي',
    selectCategory: 'اختر القسم المناسب',
    loadingOrders: 'جاري تحميل الطلبات...',
    mobile: 'الجوال',
    qtyLabel: 'الكمية:',
    approveOrder: 'موافقة على الطلب',
    completeOrder: 'تسليم الطلب',
    waitingPayment: 'بانتظار الدفع',
    cancelOrder: 'إلغاء الطلب',
    paid: 'تم الدفع',
    cityName: 'اسم المدينة',
    searchCity: 'ابحث عن مدينة...',
    searchCurrency: 'ابحث عن عملة...',
    currencyNamePlaceholder: 'مثال: دولار أمريكي',
    exchangeRateInfo: 'ملاحظة: إذا كان سعر صرف العملة (الدولار مثلاً) يساوي 0.004، فهذا يعني أن 1 دولار يساوي 250 ريال يمني.',
    officialEmail: 'البريد الإلكتروني الرسمي',
    noCategories: 'لا توجد أقسام حالياً',
    adTitlePlaceholder: 'مثال: خصم 20%',
    adImageUrl: 'رابط الصورة',
    adContent: 'المحتوى النصي',
    adLink: 'رابط التوجيه (اختياري)',
    adActive: 'مفعل',
    adImageUrlPlaceholder: 'https://...',
    adContentPlaceholder: 'نص الإعلان...',
    adLinkPlaceholder: 'https://...',
    searchUserPlaceholder: 'ابحث بالاسم أو البريد الإلكتروني...',
    cannotDeleteSelf: 'لا يمكنك حذف نفسك',
    cannotDeleteAdmin: 'لا يمكن حذف حساب المسؤول',
    userUpdatedSuccess: 'تم تحديث بيانات المستخدم بنجاح',
    userCreatedSuccess: 'تم إنشاء المستخدم بنجاح',
    userDeletedSuccess: 'تم حذف المستخدم بنجاح',
    confirmDeleteUser: 'هل أنت متأكد من حذف المستخدم',
    totalUsersDesc: 'إجمالي المستخدمين',
    customersCount: 'عملاء',
    adminsCount: 'مسؤولين',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء التحديد',
    you: 'أنت',
    inventoryManagement: 'إدارة المخزون',
    identityManagement: 'إدارة الهوية',
    fullName: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الهاتف',
    passwordLabel: 'كلمة المرور',
    roleLabel: 'الصلاحية',
    permissionsLabel: 'الأذونات',
    activityHistory: 'تاريخ النشاطات',
    exportReport: 'تصدير التقرير',
    searchActivities: 'ابحث في النشاطات...',
    allUsers: 'جميع المستخدمين',
    justNow: 'الآن',
    hoursAgo: 'ساعات',
    daysAgo: 'أيام',
    totalActivities: 'إجمالي النشاطات',
    additions: 'إضافات',
    edits: 'تعديلات',
    deletions_count: 'حذف',
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
    productNotFound: 'Product Not Found',
    home: 'Home',
    imported: 'Imported',
    reviews: 'reviews',
    quantityLabel: 'Quantity',
    itemsInStock: 'in stock',
    outOfOrder: 'Out of stock',
    buyNow: 'Buy Now',
    inCart: 'In Cart',
    source: 'Source',
    additionalDetails: 'Additional Details',
    categoryLabel: 'Category',
    availableSizes: 'Available Sizes',
    availableColors: 'Available Colors',
    pleaseSelectSize: 'Please select a size',
    pleaseSelectColor: 'Please select a color',

    checkout: 'Checkout',
    deliveryInfo: 'Delivery Information',
    fullName: 'Full Name',
    enterFullName: 'Please enter your name',
    enterPhone: 'Please enter your phone number',
    phoneValidation: 'Please enter a valid phone number',
    chooseCity: 'Choose City',
    detailedAddress: 'Detailed Address (Optional)',
    addressPlaceholder: 'Example: Street / Building / Flat',
    additionalNotes: 'Additional Notes (Optional)',
    notesPlaceholder: 'Any special notes for your order...',
    confirmViaWhatsapp: 'Confirm Order via WhatsApp',
    sending: 'Sending...',
    whatsappOrderTemplate: 'New Order',
    newOrder: 'New Order No',
    customerInfo: 'Customer Info',
    paymentSummaryLabel: 'Order Summary',
    willContactYou: 'We will contact you via WhatsApp to confirm your order and payment',
    emptyCartCheckout: 'Cart is empty. Cannot proceed to checkout',

    // Order Success
    orderSuccessTitle: 'Order Sent Successfully!',
    thankYou: 'Thank you',
    orderSuccessDesc: 'We will contact you soon via WhatsApp',
    whatsappConversationOpened: 'WhatsApp Conversation Opened',
    completePaymentInWhatsapp: 'Please complete the payment info in the WhatsApp conversation',
    nextSteps: 'Next Steps',
    reviewOrder: 'Your order will be reviewed by the store admin',
    contactConfirmAndPay: 'We will contact you via WhatsApp to confirm the order and payment',
    shipSoon: 'After payment, your order will be shipped as soon as possible',

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

    // الصفحات الداخلية المنتجات
    productCount: 'Product(s)',
    allCategories: 'All Categories',
    moreFilters: 'More',
    dateAdded: 'Date Added',
    status: 'Status',
    actions: 'Actions',
    units: 'Unit(s)',
    show: 'Show',
    viewProduct: 'View Product',
    edit: 'Edit',
    delete: 'Delete',
    noProducts: 'No products found',
    confirmDeleteProduct: 'Are you sure you want to delete this product?',

    // الصفحات الداخلية الطلبات
    ordersCount: 'Order(s)',
    searchOrders: 'Search by Order No, Customer, or Phone...',
    searchProducts: 'Search products...',
    allStatuses: 'All Statuses',
    orderNumber: 'Order Number',
    customer: 'Customer',
    date: 'Date',
    orderDetails: 'Order Details',
    contactWhatsApp: 'Contact WhatsApp',
    generateInvoice: 'Generate Invoice',
    downloadInvoice: 'Download Invoice',
    contactCustomer: 'Contact Customer',
    address: 'Address',
    subtotal: 'Subtotal',
    shippingCost: 'Shipping',
    orderTotal: 'Total',

    currency: 'YER',
    rial: 'YER',

    // Homepage
    shopNow: 'Shop Now',
    browseProducts: 'Browse Products',
    welcomeTo: 'Welcome to',
    latestTrends: 'Latest trends at competitive prices',
    featuredProducts: 'Featured Products',
    newArrivals: 'New Arrivals',
    viewAll: 'View All',
    categories: 'Categories',
    buyViaWhatsapp: 'Order via WhatsApp',
    contactNow: 'Contact Now',
    whatsappDesc: 'Shop easily and send your order directly via WhatsApp',
    fastShipping: 'Fast Shipping',
    fastShippingDesc: 'Delivery to all cities',
    securePay: 'Secure Payment',
    securePayDesc: 'Multiple payment methods',
    easyReturn: 'Easy Returns',
    easyReturnDesc: 'Product return guarantee',
    support: 'Support',
    supportDesc: '24/7 via WhatsApp',

    // Footer
    footerAbout: 'Your favorite store for modern fashion and the latest global trends. We offer the best products at competitive prices.',
    quickLinks: 'Quick Links',
    footerCategories: 'Categories',
    contactInfo: 'Contact Us',
    trackMyOrder: 'Track Order',
    allRights: 'All Rights Reserved',
    madeWith: 'Made with ❤️ in Yemen',

    // Track Order
    trackOrderTitle: 'Track Order',
    orderNotFound: 'Order Not Found',
    orderNotFoundDesc: 'Check the order number or phone number and try again',
    orderReceived: 'Order Received',
    paymentConfirmed: 'Payment Confirmed',
    shipped: 'Shipped',
    orderDelivered: 'Delivered',
    orderCancelled: 'Cancelled',
    enterOrderNumber: 'Enter Order Number or Phone',
    whatsappContact: 'Contact via WhatsApp',
    orderStatus: 'Order Status',
    orderTracking: 'Order Tracking',
    name: 'Name',
    phone: 'Phone',
    city: 'City',
    quantity: 'Quantity',
    search: 'Search',

    // Order Statuses
    statusPending: 'Pending',
    statusWaitingPayment: 'Waiting Payment',
    statusPaid: 'Paid',
    statusApproved: 'Approved',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',

    // My Account
    premiumCustomer: 'Premium Customer',
    ordersHistory: 'Orders History',
    noOrdersYetDesc: 'You haven\'t placed any orders yet. Browse our store and discover our products!',
    backToShopping: 'Back to Shopping',
    orderNumberLabel: 'Order No',
    orderDate: 'Date',
    paymentSummary: 'Payment Summary',
    itemsSummary: 'Products',
    shippingAddress: 'Shipping Address',
    menu: 'Menu',
    bulkImport: 'Full Store Import',
    discoverProducts: 'Discover Products',
    filters: 'Filters',
    clearAll: 'Clear All',
    priceRange: 'Price Range',
    minPrice: 'Min',
    maxPrice: 'Max',
    applyFilters: 'Apply Filters',
    sortBy: 'Sort By',
    sortNewest: 'Newest',
    sortPriceLow: 'Price: Low to High',
    sortPriceHigh: 'Price: High to Low',
    sortName: 'Name: A-Z',
    tryDiffSearch: 'Try changing filters or search with different keywords',
    onlyLeft: 'Only {count} left',
    clearCart: 'Clear Cart',
    browseProducts: 'Browse Products',
    whatsappConfirmNote: 'We will contact you via WhatsApp to confirm your order',
    adminCitiesTitle: 'Cities & Shipping',
    addCity: 'Add City',
    editCity: 'Edit City',
    cityPlaceholder: 'e.g. Sanaa',
    shippingCostLabel: 'Shipping Cost (Rial)',
    active: 'Active',
    inactive: 'Inactive',
    saveChanges: 'Save Changes',
    confirmDeleteCity: 'Are you sure you want to delete this city?',
    noCitiesFound: 'No cities found',
    inventoryManagement: 'Inventory Management',
    totalItems: 'total items',
    loadingInventory: 'Loading Inventory...',
    addingProduct: 'Add Product',
    confirmDeleteOrder: 'Are you sure you want to delete this order?',
    currenciesTitle: 'Currencies',
    manageExchangeRates: 'Manage Exchange Rates',
    addCurrency: 'Add Currency',
    editCurrency: 'Edit Currency',
    currencyCode: 'Currency Code',
    currencyName: 'Currency Name',
    exchangeRateLabel: 'Exchange Rate (vs YER)',
    symbolLabel: 'Symbol',
    baseCurrency: 'Base',
    cannotDeleteBaseCurrency: 'Cannot delete the base currency',
    confirmDeleteCurrency: 'Are you sure you want to delete this currency?',
    noCurrenciesFound: 'No currencies found',
    currencyInfoNote: 'Base currency is Yemeni Rial (YER). All store prices are displayed in this currency.',
    identitySettings: 'Identity & Contact Settings',
    identitySettingsDesc: 'Manage your store identity and quick access links for customers',
    branding: 'Store Branding',
    officialStoreName: 'Official Store Name',
    logoUrl: 'Logo Link (URL)',
    socialChannels: 'Social Media Channels',
    mainWhatsapp: 'Main WhatsApp',
    categoryRouting: 'Category Order Routing',
    categoryRoutingDesc: 'Route departments to specific agents',
    savedSuccessfully: 'Settings Saved!',
    saving: 'Saving...',
    adminDashboardTitle: 'Dashboard',
    welcomeBack: 'Welcome back,',
    lastUpdated: 'Last Updated',
    totalRevenue: 'Total Revenue',
    recentActivities: 'Recent Activity',
    fullLog: 'Full Log',
    quickActions: 'Quick Actions',
    noRecentActivity: 'No recent activity',
    securePersistence: 'Secure persistence active',
    dataEncrypted: 'All data encrypted locally',
    addProductShort: 'Add Product',
    adminUsersTitle: 'Users Management',
    totalUsersDesc: 'total users',
    customersCount: 'customer',
    adminsCount: 'admin',
    addUser: 'Add User',
    editUser: 'Edit User',
    fullName: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    passwordLabel: 'Password',
    roleLabel: 'User Role',
    permissionsLabel: 'Custom Permissions',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    cannotDeleteSelf: 'You cannot delete your own account',
    cannotDeleteAdmin: 'The main administrator account cannot be deleted',
    confirmDeleteUser: 'Are you sure you want to delete this user?',
    userCreatedSuccess: 'User created successfully',
    userUpdatedSuccess: 'User updated successfully',
    userDeletedSuccess: 'User deleted successfully',
    you: 'You',
    adminAdsTitle: 'Advertisements',
    adsCount: 'ad',
    addAd: 'Add Advertisement',
    editAd: 'Edit Advertisement',
    adTitle: 'Advertisement Title',
    adType: 'Type',
    adPosition: 'Position',
    adContent: 'Text Content',
    adImageUrl: 'Image URL',
    adVideoUrl: 'Video URL',
    adLink: 'Link URL (Optional)',
    adActive: 'Active',
    adTop: 'Top of Page',
    adBottom: 'Bottom of Page',
    adSidebar: 'Sidebar',
    adInline: 'In-between Categories',
    adPopup: 'Popup Window',
    imageType: 'Image',
    videoType: 'Video',
    textType: 'Text',
    adDeletedSuccess: 'Advertisement deleted successfully',
    confirmDeleteAd: 'Are you sure you want to delete this advertisement?',
    activityHistory: 'Activity History',
    exportReport: 'Export Report',
    allUsers: 'All Users',
    searchActivities: 'Search activities...',
    systemAction: 'System',
    justNow: 'Just now',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    totalActivities: 'Total Activities',
    additions: 'Additions',
    edits: 'Edits',
    deletions_count: 'Deletions',
    manageProducts: 'Product Management',
    availableProducts: 'products available',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    importFromUrl: 'Import from URL',
    searchByProductName: 'Search by product name...',
    allCategories: 'All Categories',
    productName: 'Product Name',
    productDescription: 'Detailed Description',
    productPrice: 'Price',
    productCategory: 'Category',
    stockLabel: 'Stock',
    stockUnits: 'units',
    visibilityStatus: 'Status',
    visible: 'Visible',
    hidden: 'Hidden',
    productAddedSuccess: 'Product added successfully!',
    productUpdatedSuccess: 'Product updated successfully!',
    productDeletedSuccess: 'Product deleted successfully!',
    errorSavingProduct: 'Error saving product',
    confirmDeleteProduct: 'Are you sure you want to delete this product?',
    loadingProducts: 'Loading products...',
    visualAssets: 'Visual Assets',
    uploadImages: 'Upload Images',
    fromUrl: 'From URL',
    mainImage: 'Main',
    sizesAndVariants: 'Sizes & Variants',
    addSize: '+ Add Size',
    addColor: '+ Add Color',
    colorMapping: 'Color Mapping',
    saveFinalProduct: 'Save Product',
    addedAt: 'Added at:',
    generalInfo: 'General Info',
    detailedDescription: 'Detailed Description',
    selectCategory: 'Select Branch',
    loadingOrders: 'Loading Orders...',
    mobile: 'Phone',
    qtyLabel: 'Qty:',
    approveOrder: 'Approve Order',
    completeOrder: 'Complete Order',
    waitingPayment: 'Waiting Payment',
    cancelOrder: 'Cancel Order',
    paid: 'Paid',
    cityName: 'City Name',
    searchCity: 'Search cities...',
    searchCurrency: 'Search currencies...',
    currencyNamePlaceholder: 'e.g. US Dollar',
    exchangeRateInfo: 'Note: If the exchange rate is 0.004, then 1 unit of this currency equals 250 Yemeni Rial.',
    officialEmail: 'Official Email',
    noCategories: 'No categories available',
    adTitlePlaceholder: 'e.g. 20% Off',
    adImageUrl: 'Image URL',
    adContent: 'Text Content',
    adLink: 'Redirect Link (Optional)',
    adActive: 'Active',
    adImageUrlPlaceholder: 'https://...',
    adContentPlaceholder: 'Ad text content...',
    adLinkPlaceholder: 'https://...',
    searchUserPlaceholder: 'Search by name or email...',
    cannotDeleteSelf: 'You cannot delete yourself',
    cannotDeleteAdmin: 'Cannot delete an admin account',
    userUpdatedSuccess: 'User data updated successfully',
    userCreatedSuccess: 'User created successfully',
    userDeletedSuccess: 'User deleted successfully',
    confirmDeleteUser: 'Are you sure you want to delete user',
    totalUsersDesc: 'Total Users',
    customersCount: 'Customers',
    adminsCount: 'Admins',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    you: 'You',
    inventoryManagement: 'Inventory Management',
    identityManagement: 'Identity Management',
    fullName: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    passwordLabel: 'Password',
    roleLabel: 'Role',
    permissionsLabel: 'Permissions',
    activityHistory: 'Activity History',
    exportReport: 'Export Report',
    searchActivities: 'Search activities...',
    allUsers: 'All Users',
    justNow: 'Just now',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
    totalActivities: 'Total Activities',
    additions: 'Additions',
    edits: 'Edits',
    deletions_count: 'Deletions',
  },
};

// Category names map for bilingual support
export const categoryNames: Record<string, Record<'ar' | 'en', string>> = {
  'cat-1': { ar: 'ملابس نسائية', en: "Women's Clothes" },
  'cat-2': { ar: 'ملابس رجالية', en: "Men's Clothes" },
  'cat-3': { ar: 'أحذية', en: 'Shoes' },
  'cat-4': { ar: 'إكسسوارات', en: 'Accessories' },
  'cat-5': { ar: 'حقائب', en: 'Bags' },
  'cat-6': { ar: 'عطور', en: 'Perfumes' },
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
