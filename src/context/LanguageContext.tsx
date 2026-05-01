import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';

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
  kidsClothes: string;
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
  customerRole: string;
  refresh: string;
  salesOverview: string;
  last7Days: string;
  topCategories: string;
  selectCategory: string;
  add: string;
  
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
  address: string;
  subtotal: string;
  shippingCost: string;
  orderTotal: string;
  cancelOrder: string;

  // عام
  currency: string;
  rial: string;
  name: string;
  phone: string;
  city: string;
  quantity: string;
  search: string;

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
  tiktok: string;
  followUsOnTiktok: string;
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
  editProduct: string;
  searchByProductName: string;
  productPrice: string;
  productCategory: string;
  stockLabel: string;
  stockUnits: string;
  visibilityStatus: string;
  productAddedSuccess: string;
  productUpdatedSuccess: string;
  productDeletedSuccess: string;
  errorSavingProduct: string;
  loadingProducts: string;
  visualAssets: string;
  uploadImages: string;
  fromUrl: string;
  mainImage: string;
  sizesAndVariants: string;
  colorMapping: string;
  saveFinalProduct: string;
  addedAt: string;
  generalInfo: string;
  detailedDescription: string;
  loadingOrders: string;
  mobile: string;
  qtyLabel: string;
  approveOrder: string;
  waitingPayment: string;
  paid: string;
  cityName: string;
  searchCity: string;
  searchCurrency: string;
  currencyNamePlaceholder: string;
  exchangeRateInfo: string;
  officialEmail: string;
  noCategories: string;
  adTitlePlaceholder: string;
  adImageUrlPlaceholder: string;
  adContentPlaceholder: string;
  adLinkPlaceholder: string;
  searchUserPlaceholder: string;
  installApp: string;
  updatedCount: string;
  deleteItemsConfirm: string;
  deletedSuccessfully: string;
  productVisibleMsg: string;
  productHiddenMsg: string;
  errorBulkUpdate: string;
  whatsappMessageTemplate: string;
  invoiceGenerated: string;
  noActivitiesFound: string;
  noOrdersMatching: string;
  noProductsMatching: string;
  cityDuplicate: string;
  cityAdded: string;
  cityUpdated: string;
  citySaveError: string;
  cityDeleteError: string;
  activate: string;
  deactivate: string;
  citiesCountLabel: string;
  currencyUpdated: string;
  currencyAdded: string;
  currencySaveError: string;
  currencyDeleted: string;
  currencyDeleteError: string;
  importantNote: string;
  relativeToBase: string;
  adAdded: string;
  adUpdated: string;
  adDeleted: string;
  adSaveError: string;
  adDeleteError: string;
  viewReports: string;
  exportData: string;
  unauthorizedError: string;

  // صفحة الهوم
  shopNow: string;
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
    kidsClothes: 'ملابس أطفال',
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
    productDescription: 'الوصف التفصيلي',
    price: 'السعر',
    category: 'القسم',
    stockQuantity: 'الكمية في المخزون',
    sourceUrl: 'رابط المصدر (اختياري)',
    visible: 'ظاهر للعملاء',
    hidden: 'مخفي من العملاء',
    productImages: 'صور المنتج',
    sizes: 'المقاسات',
    colors: 'الألوان',
    addSize: '+ إضافة مقاس',
    addColor: '+ إضافة لون',
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
    customerRole: 'عميل',
    refresh: 'تحديث',
    salesOverview: 'نظرة عامة على المبيعات',
    last7Days: 'آخر 7 أيام',
    topCategories: 'أفضل الفئات',
    selectCategory: 'اختر القسم المناسب',
    add: 'إضافة',
    
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

    productCount: 'منتج',
    allCategories: 'جميع الأقسام',
    moreFilters: 'المزيد',
    dateAdded: 'تاريخ الإضافة',
    status: 'الحالة',
    actions: 'إجراءات',
    units: 'قطعة',
    show: 'إظهار',
    viewProduct: 'عرض المنتج',
    edit: 'تعديل',
    delete: 'حذف',
    noProducts: 'لا توجد منتجات',
    confirmDeleteProduct: 'هل أنت متأكد من حذف هذا المنتج؟',

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
    cancelOrder: 'إلغاء الطلب',

    currency: 'YER',
    rial: 'ر.ي',
    name: 'الاسم',
    phone: 'الجوال',
    city: 'المدينة',
    quantity: 'الكمية',
    search: 'بحث',

    statusPending: 'قيد الانتظار',
    statusWaitingPayment: 'بانتظار الدفع',
    statusPaid: 'تم الدفع',
    statusApproved: 'تمت الموافقة',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغي',

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
    whatsappConfirmNote: 'سيتم توجيهك للواتساب',
    adminCitiesTitle: 'إدارة المدن',
    addCity: 'إضافة مدينة',
    editCity: 'تعديل مدينة',
    cityPlaceholder: 'اسم المدينة...',
    shippingCostLabel: 'تكلفة الشحن',
    active: 'نشط',
    inactive: 'غير نشط',
    saveChanges: 'حفظ التغييرات',
    confirmDeleteCity: 'حذف المدينة؟',
    noCitiesFound: 'لا توجد مدن',
    inventoryManagement: 'إدارة المخزون',
    totalItems: 'إجمالي القطع',
    loadingInventory: 'جاري التحميل...',
    addingProduct: 'إضافة...',
    confirmDeleteOrder: 'حذف الطلب؟',
    currenciesTitle: 'إدارة العملات',
    manageExchangeRates: 'أسعار الصرف',
    addCurrency: 'إضافة عملة',
    editCurrency: 'تعديل عملة',
    currencyCode: 'الرمز',
    currencyName: 'الاسم',
    exchangeRateLabel: 'سعر الصرف',
    symbolLabel: 'العلامة',
    baseCurrency: 'العملة الأساسية',
    cannotDeleteBaseCurrency: 'لا يمكن حذف العملة الأساسية',
    confirmDeleteCurrency: 'حذف العملة؟',
    noCurrenciesFound: 'لا توجد عملات',
    currencyInfoNote: 'معلومات الصرف',
    identitySettings: 'إعدادات الهوية',
    identitySettingsDesc: 'تغيير اسم الشعار',
    branding: 'العلامة التجارية',
    officialStoreName: 'اسم المتجر',
    logoUrl: 'رابط الشعار',
    socialChannels: 'قنوات التواصل',
    mainWhatsapp: 'واتساب الرئيسي',
    categoryRouting: 'توجيه الفئات',
    categoryRoutingDesc: 'إدارة الروابط',
    savedSuccessfully: 'تم الحفظ',
    saving: 'جاري الحفظ...',
    adminDashboardTitle: 'لوحة التحكم',
    welcomeBack: 'مرحباً بعودتك',
    lastUpdated: 'آخر تحديث',
    fullLog: 'السجل الكامل',
    quickActions: 'إجراءات سريعة',
    noRecentActivity: 'لا نشاط مؤخراً',
    securePersistence: 'حفظ آمن',
    dataEncrypted: 'مشفر',
    addProductShort: 'إضافة',
    adminUsersTitle: 'المستخدمين',
    totalUsersDesc: 'إجمالي المستخدمين',
    customersCount: 'عملاء',
    adminsCount: 'مدراء',
    addUser: 'إضافة مستخدم',
    editUser: 'تعديل',
    emailLabel: 'البريد',
    phoneLabel: 'الهاتف',
    passwordLabel: 'كلمة السر',
    roleLabel: 'الصلاحية',
    permissionsLabel: 'الأذونات',
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء الكل',
    cannotDeleteSelf: 'لا تحذف نفسك',
    cannotDeleteAdmin: 'لا يمكن حذف المدير',
    confirmDeleteUser: 'حذف المستخدم؟',
    userCreatedSuccess: 'تم الإنشاء',
    userUpdatedSuccess: 'تم التحديث',
    userDeletedSuccess: 'تم الحذف',
    you: 'أنت',
    adminAdsTitle: 'إدارة الإعلانات',
    adsCount: 'إعلان',
    addAd: 'إضافة إعلان',
    editAd: 'تعديل الإعلان',
    adTitle: 'العنوان',
    adType: 'النوع',
    adPosition: 'الموقع',
    adContent: 'المحتوى',
    adImageUrl: 'رابط الصورة',
    adVideoUrl: 'رابط الفيديو',
    adLink: 'الرابط',
    adActive: 'نشط',
    adTop: 'أعلى',
    adBottom: 'أسفل',
    adSidebar: 'جانبي',
    adInline: 'داخلي',
    tiktok: 'تيك توك',
    followUsOnTiktok: 'تابعنا على تيك توك',
    adPopup: 'منبثق',
    imageType: 'صورة',
    videoType: 'فيديو',
    textType: 'نص',
    adDeletedSuccess: 'تم الحذف',
    confirmDeleteAd: 'حذف الإعلان؟',
    activityHistory: 'تاريخ النشاط',
    exportReport: 'تصدير',
    allUsers: 'الكل',
    searchActivities: 'بحث...',
    systemAction: 'النظام',
    justNow: 'الآن',
    hoursAgo: 'ساعات',
    daysAgo: 'أيام',
    totalActivities: 'النشاطات',
    additions: 'إضافات',
    edits: 'تعديلات',
    deletions_count: 'حذف',
    manageProducts: 'إدارة المنتجات',
    availableProducts: 'منتج متاح',
    editProduct: 'تعديل المنتج',
    searchByProductName: 'بحث بالاسم...',
    productPrice: 'السعر',
    productCategory: 'الفئة',
    stockLabel: 'المخزون',
    stockUnits: 'قطع',
    visibilityStatus: 'الحالة',
    productAddedSuccess: 'تمت الإضافة',
    productUpdatedSuccess: 'تم التحديث',
    productDeletedSuccess: 'تم الحذف',
    errorSavingProduct: 'خطأ في الحفظ',
    loadingProducts: 'تحميل...',
    visualAssets: 'الصور',
    uploadImages: 'رفع',
    fromUrl: 'رابط',
    mainImage: 'أساسي',
    sizesAndVariants: 'المقاسات',
    colorMapping: 'الألوان',
    saveFinalProduct: 'حفظ',
    addedAt: 'أضيف في',
    generalInfo: 'معلومات عامة',
    detailedDescription: 'الوصف',
    loadingOrders: 'تحميل الطلبات...',
    mobile: 'جوال',
    qtyLabel: 'كمية',
    approveOrder: 'موافقة',
    waitingPayment: 'انتظار دقع',
    paid: 'مدفوع',
    cityName: 'المدينة',
    searchCity: 'بحث مدينة',
    searchCurrency: 'بحث عملة',
    currencyNamePlaceholder: 'اسم العملة',
    exchangeRateInfo: 'سعر الصرف',
    officialEmail: 'البريد',
    noCategories: 'لا أقسام',
    adTitlePlaceholder: 'عنوان',
    adImageUrlPlaceholder: 'رابط صورة',
    adContentPlaceholder: 'نص',
    adLinkPlaceholder: 'رابط',
    searchUserPlaceholder: 'ابحث عن مستخدم...',
    installApp: 'تثبيت التطبيق',
    updatedCount: 'تم تحديث {count} بنجاح',
    deleteItemsConfirm: 'هل أنت متأكد من حذف {count}؟',
    deletedSuccessfully: 'تم الحذف بنجاح',
    productVisibleMsg: 'المنتج الآن مرئي للجميع',
    productHiddenMsg: 'تم إخفاء المنتج بنجاح',
    errorBulkUpdate: 'فشلت عملية التحديث الشاملة',
    whatsappMessageTemplate: 'مرحباً، بخصوص طلبك {orderNumber}. نحن بصدد مراجعة طلبك. هل يمكنك تأكيد طريقة الدفع المناسبة لك؟',
    invoiceGenerated: 'تم إنشاء فاتورة للطلب {orderNumber}',
    noActivitiesFound: 'لا توجد نشاطات سجلت بعد',
    noOrdersMatching: 'لا توجد طلبات تطابق بحثك',
    noProductsMatching: 'لا توجد منتجات تطابق بحثك',
    cityDuplicate: 'هذه المدينة موجودة بالفعل',
    cityAdded: 'تم إضافة المدينة بنجاح',
    cityUpdated: 'تم تحديث المدينة بنجاح',
    citySaveError: 'فشل في حفظ المدينة',
    cityDeleteError: 'فشل في حذف المدينة',
    activate: 'تنشيط',
    deactivate: 'تعطيل',
    citiesCountLabel: 'مدينة',
    currencyUpdated: 'تم تحديث العملة بنجاح',
    currencyAdded: 'تم إضافة العملة بنجاح',
    currencySaveError: 'فشل في حفظ العملة',
    currencyDeleted: 'تم حذف العملة بنجاح',
    currencyDeleteError: 'فشل في حذف العملة',
    importantNote: 'ملاحظة هامة',
    relativeToBase: 'الارتباط بالعملة الأساسية',
    adAdded: 'تم إضافة الإعلان بنجاح',
    adUpdated: 'تم تحديث الإعلان بنجاح',
    adDeleted: 'تم حذف الإعلان بنجاح',
    adSaveError: 'فشل في حفظ الإعلان',
    adDeleteError: 'فشل في حذف الإعلان',
    viewReports: 'عرض التقارير',
    exportData: 'تصدير البيانات',
    unauthorizedError: 'غير مصرح له - يرجى إعادة تسجيل الدخول',

    shopNow: 'تسوق الآن',
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

    footerAbout: 'متجرك المفضل للأزياء العصرية ومتابعة أحدث الصيحات العالمية. نوفر لك أفضل المنتجات بأسعار منافسة.',
    quickLinks: 'روابط سريعة',
    footerCategories: 'الأقسام',
    contactInfo: 'تواصل معنا',
    trackMyOrder: 'تتبع طلبي',
    allRights: 'جميع الحقوق محفوظة',
    madeWith: 'صُنع بـ ❤️ في اليمن',

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
    kidsClothes: 'Kids Clothes',
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
    customerRole: 'Customer',
    refresh: 'Refresh',
    salesOverview: 'Sales Overview',
    last7Days: 'Last 7 Days',
    topCategories: 'Top Categories',
    selectCategory: 'Select Category',
    add: 'Add',

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
    cancelOrder: 'Cancel Order',

    currency: 'YER',
    rial: 'YER',
    name: 'Name',
    phone: 'Phone',
    city: 'City',
    quantity: 'Quantity',
    search: 'Search',

    statusPending: 'Pending',
    statusWaitingPayment: 'Waiting Payment',
    statusPaid: 'Paid',
    statusApproved: 'Approved',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',

    premiumCustomer: 'Premium Customer',
    ordersHistory: 'Order History',
    noOrdersYetDesc: 'You haven\'t made any orders yet. Start shopping!',
    backToShopping: 'Back to Shopping',
    orderNumberLabel: 'Order #',
    orderDate: 'Date',
    paymentSummary: 'Payment Summary',
    itemsSummary: 'Items',
    shippingAddress: 'Shipping Address',
    menu: 'Menu',
    bulkImport: 'Bulk Import',
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
    tryDiffSearch: 'Try different filters or search terms',
    onlyLeft: '{count} left',
    clearCart: 'Clear Cart',
    browseProducts: 'Browse Products',
    whatsappConfirmNote: 'Redirecting to WhatsApp',
    adminCitiesTitle: 'Manage Cities',
    addCity: 'Add City',
    editCity: 'Edit City',
    cityPlaceholder: 'City name...',
    shippingCostLabel: 'Shipping Cost',
    active: 'Active',
    inactive: 'Inactive',
    saveChanges: 'Save Changes',
    confirmDeleteCity: 'Delete City?',
    noCitiesFound: 'No cities found',
    inventoryManagement: 'Inventory',
    totalItems: 'Total Units',
    loadingInventory: 'Loading...',
    addingProduct: 'Adding...',
    confirmDeleteOrder: 'Delete order?',
    currenciesTitle: 'Currencies',
    manageExchangeRates: 'Exchanges',
    addCurrency: 'Add Currency',
    editCurrency: 'Edit Currency',
    currencyCode: 'Code',
    currencyName: 'Name',
    exchangeRateLabel: 'Rate',
    symbolLabel: 'Symbol',
    baseCurrency: 'Base',
    cannotDeleteBaseCurrency: 'Cannot delete base',
    confirmDeleteCurrency: 'Delete currency?',
    noCurrenciesFound: 'No currencies found',
    currencyInfoNote: 'Exchange info',
    identitySettings: 'Identity Settings',
    identitySettingsDesc: 'Branding setup',
    branding: 'Branding',
    officialStoreName: 'Store Name',
    logoUrl: 'Logo URL',
    socialChannels: 'Socials',
    mainWhatsapp: 'Main WhatsApp',
    categoryRouting: 'Routing',
    categoryRoutingDesc: 'Slug management',
    savedSuccessfully: 'Saved!',
    saving: 'Saving...',
    adminDashboardTitle: 'Dashboard',
    welcomeBack: 'Welcome Back',
    lastUpdated: 'Last Updated',
    fullLog: 'View Logs',
    quickActions: 'Quick Actions',
    noRecentActivity: 'No activity',
    securePersistence: 'Secure Save',
    dataEncrypted: 'Encrypted',
    addProductShort: 'Add',
    adminUsersTitle: 'Users',
    totalUsersDesc: 'Total Users',
    customersCount: 'Customers',
    adminsCount: 'Admins',
    addUser: 'Add User',
    editUser: 'Edit',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    passwordLabel: 'Password',
    roleLabel: 'Role',
    permissionsLabel: 'Permissions',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    cannotDeleteSelf: 'Cannot delete self',
    cannotDeleteAdmin: 'Cannot delete admin',
    confirmDeleteUser: 'Delete user?',
    userCreatedSuccess: 'Created!',
    userUpdatedSuccess: 'Updated!',
    userDeletedSuccess: 'Deleted!',
    you: 'You',
    adminAdsTitle: 'Manage Ads',
    adsCount: 'Ads',
    addAd: 'Add Ad',
    editAd: 'Edit Ad',
    adTitle: 'Title',
    adType: 'Type',
    adPosition: 'Position',
    adContent: 'Content',
    adImageUrl: 'Image URL',
    adVideoUrl: 'Video URL',
    adLink: 'Link',
    adActive: 'Active',
    adTop: 'Top',
    adBottom: 'Bottom',
    adSidebar: 'Sidebar',
    adInline: 'Inline',
    tiktok: 'TikTok',
    followUsOnTiktok: 'Follow us on TikTok',
    adPopup: 'Popup',
    imageType: 'Image',
    videoType: 'Video',
    textType: 'Text',
    adDeletedSuccess: 'Deleted',
    confirmDeleteAd: 'Delete ad?',
    activityHistory: 'Activity Log',
    exportReport: 'Export',
    allUsers: 'All',
    searchActivities: 'Search...',
    systemAction: 'System',
    justNow: 'Now',
    hoursAgo: 'hours',
    daysAgo: 'days',
    totalActivities: 'Activities',
    additions: 'Additions',
    edits: 'Edits',
    deletions_count: 'Deletions',
    manageProducts: 'Products',
    availableProducts: 'Available',
    editProduct: 'Edit Product',
    searchByProductName: 'Search Name...',
    productPrice: 'Price',
    productCategory: 'Category',
    stockLabel: 'Stock',
    stockUnits: 'units',
    visibilityStatus: 'Status',
    productAddedSuccess: 'Added',
    productUpdatedSuccess: 'Updated',
    productDeletedSuccess: 'Deleted',
    errorSavingProduct: 'Error saving',
    loadingProducts: 'Loading...',
    visualAssets: 'Images',
    uploadImages: 'Upload',
    fromUrl: 'URL',
    mainImage: 'Main',
    sizesAndVariants: 'Sizes',
    colorMapping: 'Colors',
    saveFinalProduct: 'Save',
    addedAt: 'Added at',
    generalInfo: 'General',
    detailedDescription: 'Description',
    loadingOrders: 'Loading...',
    mobile: 'Mobile',
    qtyLabel: 'Qty',
    approveOrder: 'Approve',
    waitingPayment: 'Waiting',
    paid: 'Paid',
    cityName: 'City',
    searchCity: 'Search City',
    searchCurrency: 'Search Currency',
    currencyNamePlaceholder: 'Currency Name',
    exchangeRateInfo: 'Exchange Rate',
    officialEmail: 'Email',
    noCategories: 'No categories',
    adTitlePlaceholder: 'Title',
    adImageUrlPlaceholder: 'Image URL',
    adContentPlaceholder: 'Text',
    adLinkPlaceholder: 'Link',
    searchUserPlaceholder: 'Search user...',
    installApp: 'Install App',
    updatedCount: 'Updated {count} successfully',
    deleteItemsConfirm: 'Are you sure you want to delete {count} items?',
    deletedSuccessfully: 'Deleted successfully',
    productVisibleMsg: 'Product is now visible',
    productHiddenMsg: 'Product is now hidden',
    errorBulkUpdate: 'Bulk update failed',
    whatsappMessageTemplate: 'Hello, regarding your order {orderNumber}. We are processing it. Could you confirm your payment method?',
    invoiceGenerated: 'Invoice generated for order {orderNumber}',
    noActivitiesFound: 'No activities found',
    noOrdersMatching: 'No orders found matching your search',
    noProductsMatching: 'No products found matching your criteria',
    cityDuplicate: 'This city already exists',
    cityAdded: 'City added successfully',
    cityUpdated: 'City updated successfully',
    citySaveError: 'Failed to save city',
    cityDeleteError: 'Failed to delete city',
    activate: 'Activate',
    deactivate: 'Deactivate',
    citiesCountLabel: 'cities',
    currencyUpdated: 'Currency updated successfully',
    currencyAdded: 'Currency added successfully',
    currencySaveError: 'Failed to save currency',
    currencyDeleted: 'Currency deleted successfully',
    currencyDeleteError: 'Failed to delete currency',
    importantNote: 'Important Note',
    relativeToBase: 'Relative to Base',
    adAdded: 'Ad added successfully',
    adUpdated: 'Ad updated successfully',
    adDeleted: 'Ad deleted successfully',
    adSaveError: 'Failed to save ad',
    adDeleteError: 'Failed to delete ad',
    viewReports: 'View Reports',
    exportData: 'Export Data',
    unauthorizedError: 'Unauthorized - Please login again',

    shopNow: 'Shop Now',
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

    footerAbout: 'Your favorite store for modern fashion and trend updates. We offer quality products at competitive prices.',
    quickLinks: 'Quick Links',
    footerCategories: 'Categories',
    contactInfo: 'Contact Us',
    trackMyOrder: 'Track My Order',
    allRights: 'All rights reserved',
    madeWith: 'Made with ❤️',

    trackOrderTitle: 'Track Order',
    orderNotFound: 'Order Not Found',
    orderNotFoundDesc: 'Check order number or phone and try again',
    orderReceived: 'Order Received',
    paymentConfirmed: 'Payment Confirmed',
    shipped: 'Shipped',
    orderDelivered: 'Delivered',
    orderCancelled: 'Order Cancelled',
    enterOrderNumber: 'Enter Order Number or Phone',
    whatsappContact: 'Contact via WhatsApp',
    orderStatus: 'Order Status',
    orderTracking: 'Order Tracking',
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
  'cat-7': { ar: 'ملابس أطفال', en: 'Kids Clothes' },
};

// Heuristic map for Arabic names to English
export const arabicToEnglishMap: Record<string, string> = {
  // الأقسام (Categories)
  'ولادي': "Boys",
  'ملابس نسائية': "Women's Clothing",
  'ملابس رجالية': "Men's Clothing",
  'أحذية': "Shoes",
  'إكسسوارات': "Accessories",
  'حقائب': "Bags",
  'عطور': "Perfumes",
  'ملابس أطفال': "Kids Clothes",
  'الكل': "All",
  'عادي': "Standard",

  // كلمات شائعة في أسماء المنتجات (Product Names & Terms)
  'فستان': "Dress",
  'قميص': "Shirt",
  'بنطلون': "Pants",
  'جاكيت': "Jacket",
  'بلوزة': "Blouse",
  'تيشيرت': "T-Shirt",
  'ساعة': "Watch",
  'نظارة': "Glasses",
  'شنطة': "Bag",
  'محفظة': "Wallet",
  'عطر': "Perfume",
  'شوز': "Shoes",
  'جينز': "Jeans",
  'قطن': "Cotton",
  'طقم': "Set",
  'رياضي': "Sport",
  'جلد': "Leather",
  'أسود': "Black",
  'أبيض': "White",
  'أحمر': "Red",
  'أزرق': "Blue",
  'أخضر': "Green",
  'بني': "Brown",
  'رمادي': "Grey",
  'بيج': "Beige",
  'ذهبي': "Gold",
  'فضي': "Silver",
  'طويل': "Long",
  'قصير': "Short",
  'سهرة': "Evening",
  'ناعم': "Soft",
  'فاخر': "Premium",
  'عرض': "Sale",
  'جديد': "New",
  'توصيل': "Shipping",
  'مجاني': "Free",
  'ريال': "SAR",
};

/**
 * يقوم بترجمة النص كلمة بكلمة إذا لم يجد ترجمة كاملة للجملة
 * لضمان ترجمة أسماء المنتجات والأقسام حتى لو لم تكن في قاعدة البيانات
 */
export const translateText = (text: string, lang: Language) => {
  if (lang === 'ar' || !text) return text;
  
  // 1. محاولة البحث عن الجملة كاملة أولاً
  if (arabicToEnglishMap[text]) return arabicToEnglishMap[text];
  
  // 2. تقسيم الجملة وترجمة كل كلمة على حدة (للأسماء المركبة مثل: فستان أسود)
  const words = text.split(/\s+/);
  const translatedWords = words.map(word => {
    // إزالة الحركات أو ال التعريف للبحث بشكل أفضل
    const cleanWord = word.replace(/^(ال)/, ''); 
    return arabicToEnglishMap[word] || arabicToEnglishMap[cleanWord] || word;
  });
  
  return translatedWords.join(' ');
};

export const translateCategory = (id: string, name: string, lang: Language) => {
  if (lang === 'ar') return name;
  // استخدام المحرك الجديد للترجمة
  return categoryNames[id]?.en || translateText(name, lang);
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
    try {
      return (localStorage.getItem('fashionHubLang') as Language) || 'ar';
    } catch (e) {
      return 'ar';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('fashionHubLang', lang);
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
    // تغيير اتجاه الصفحة
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
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
