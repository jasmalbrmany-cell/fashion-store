# 📐 مخططات النظام - Fashion Hub Store

## 🗺️ نظرة عامة

هذا الملف يحتوي على جميع المخططات التوضيحية للنظام.

---

## 1️⃣ مخطط النظام الكامل (System Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         المستخدم (User)                          │
│                    (متصفح الويب / الموبايل)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Context    │          │
│  │  (الصفحات)   │  │  (المكونات)  │  │  (الحالة)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Services Layer (طبقة الخدمات)            │          │
│  │  - productsService                               │          │
│  │  - ordersService                                 │          │
│  │  - citiesService                                 │          │
│  │  - currenciesService                             │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Client (SDK)                         │
│                  (الاتصال بقاعدة البيانات)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Supabase + Vercel)                   │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   Supabase           │  │  Vercel Functions    │            │
│  │  - PostgreSQL        │  │  - api/scrape.ts     │            │
│  │  - Auth              │  │  - api/catalog.ts    │            │
│  │  - Storage           │  │  - Rate Limiting     │            │
│  │  - RLS Policies      │  └──────────────────────┘            │
│  └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                         │
│  10 جداول + RLS + Triggers + Functions                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ مخطط قاعدة البيانات (Database Schema)

```
┌─────────────────────┐
│   auth.users        │ (Supabase Auth)
│  - id (UUID)        │
│  - email            │
│  - password_hash    │
└──────────┬──────────┘
           │
           │ 1:1
           ▼
┌─────────────────────┐
│   profiles          │
│  - id (FK)          │◄────────┐
│  - email            │         │
│  - name             │         │ 1:1
│  - phone            │         │
│  - role             │         │
│  - avatar           │         │
└──────────┬──────────┘         │
           │                    │
           │ 1:N                │
           ▼                    │
┌─────────────────────┐         │
│  user_permissions   │─────────┘
│  - user_id (FK)     │
│  - can_manage_*     │
└─────────────────────┘

┌─────────────────────┐
│   categories        │
│  - id (UUID)        │
│  - name             │
│  - icon             │
│  - parent_id (FK)   │◄─┐ Self-referencing
│  - order            │  │ (للفئات الفرعية)
└──────────┬──────────┘  │
           │              │
           │ 1:N          │
           ▼              │
┌─────────────────────┐  │
│   products          │  │
│  - id (UUID)        │  │
│  - name             │  │
│  - description      │  │
│  - price            │  │
│  - category_id (FK) │──┘
│  - images (JSONB)   │
│  - sizes (JSONB)    │
│  - colors (JSONB)   │
│  - stock            │
│  - is_visible       │
│  - source_url       │
└─────────────────────┘

┌─────────────────────┐
│   cities            │
│  - id (UUID)        │
│  - name             │
│  - shipping_cost    │
│  - is_active        │
└─────────────────────┘

┌─────────────────────┐
│   currencies        │
│  - id (UUID)        │
│  - code             │
│  - name             │
│  - exchange_rate    │
│  - symbol           │
└─────────────────────┘

┌─────────────────────┐
│   orders            │
│  - id (UUID)        │
│  - order_number     │
│  - customer_name    │
│  - customer_phone   │
│  - customer_id (FK) │──┐
│  - city             │  │
│  - address          │  │
│  - items (JSONB)    │  │ N:1
│  - subtotal         │  │
│  - shipping_cost    │  │
│  - total            │  │
│  - status           │  │
│  - notes            │  │
└─────────────────────┘  │
                         │
                         ▼
              ┌─────────────────────┐
              │   profiles          │
              │  (customer)         │
              └─────────────────────┘

┌─────────────────────┐
│   ads               │
│  - id (UUID)        │
│  - title            │
│  - type             │
│  - content          │
│  - image_url        │
│  - video_url        │
│  - link             │
│  - position         │
│  - is_active        │
│  - start_date       │
│  - end_date         │
│  - order            │
└─────────────────────┘

┌─────────────────────┐
│  activity_logs      │
│  - id (UUID)        │
│  - user_id (FK)     │──┐
│  - user_name        │  │ N:1
│  - action           │  │
│  - details          │  │
│  - created_at       │  │
└─────────────────────┘  │
                         │
                         ▼
              ┌─────────────────────┐
              │   profiles          │
              └─────────────────────┘

┌─────────────────────┐
│  store_settings     │
│  - id (UUID)        │
│  - name             │
│  - logo             │
│  - currency         │
│  - social_links     │
│  - is_maintenance   │
└─────────────────────┘
```

---

## 3️⃣ مخطط تدفق البيانات (Data Flow)

### إضافة منتج جديد:

```
[Admin User]
     │
     │ 1. يملأ نموذج المنتج
     ▼
[AddProductPage.tsx]
     │
     │ 2. يرسل البيانات
     ▼
[productsService.create()]
     │
     │ 3. يستدعي Supabase
     ▼
[supabase.from('products').insert()]
     │
     │ 4. يتحقق من الصلاحيات
     ▼
[RLS Policy Check]
     │
     ├─── ✅ Admin? → يسمح
     │
     └─── ❌ Not Admin? → يرفض
     │
     │ 5. يحفظ في قاعدة البيانات
     ▼
[PostgreSQL Database]
     │
     │ 6. يرجع النتيجة
     ▼
[Response: {data, error}]
     │
     │ 7. يحدث الواجهة
     ▼
[UI Update + Toast Notification]
```

### إنشاء طلب جديد:

```
[Customer]
     │
     │ 1. يضيف منتجات للسلة
     ▼
[CartContext]
     │
     │ 2. يحفظ في localStorage
     ▼
[localStorage]
     │
     │ 3. يذهب للدفع
     ▼
[CheckoutPage.tsx]
     │
     │ 4. يملأ معلومات الشحن
     ▼
[ordersService.create()]
     │
     │ 5. ينشئ رقم طلب
     ▼
[Generate Order Number]
     │
     │ 6. يحفظ في قاعدة البيانات
     ▼
[supabase.from('orders').insert()]
     │
     │ 7. يرسل رسالة واتساب
     ▼
[WhatsApp API]
     │
     │ 8. يعيد توجيه للنجاح
     ▼
[OrderSuccessPage.tsx]
```

---

## 4️⃣ مخطط لوحة التحكم (Admin Dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Dashboard                             │
│                     /admin (DashboardPage)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ إحصائيات     │  │  رسوم بيانية │  │ نشاطات حديثة │          │
│  │ - المنتجات   │  │  - المبيعات  │  │ - آخر 10     │          │
│  │ - الطلبات    │  │  - الطلبات   │  │   عمليات     │          │
│  │ - العملاء    │  │  - الإيرادات │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   المنتجات   │    │   الطلبات    │    │  المستخدمين  │
│  /products   │    │   /orders    │    │   /users     │
│              │    │              │    │              │
│ - عرض الكل   │    │ - عرض الكل   │    │ - عرض الكل   │
│ - إضافة      │    │ - تغيير     │    │ - تعديل      │
│ - تعديل      │    │   الحالة     │    │   الأدوار    │
│ - حذف        │    │ - حذف        │    │ - حذف        │
│ - إخفاء      │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ├─────────────┐
        │             │
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│ إضافة منتج   │ │ استيراد من   │
│   /add       │ │  متجر /store │
│              │ │              │
│ - يدوي       │ │ - منتج واحد  │
│              │ │ - كتالوج كامل│
└──────────────┘ └──────────────┘

        ┌────────────────────┐
        │                    │
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│   الإعدادات  │    │    المدن     │
│  /settings   │    │   /cities    │
│              │    │              │
│ - اسم المتجر │    │ - إضافة     │
│ - الشعار     │    │ - تعديل     │
│ - الواتساب   │    │ - حذف       │
│ - السوشيال   │    │ - تفعيل     │
└──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│   العملات    │
│ /currencies  │
│              │
│ - إضافة     │
│ - تعديل     │
│ - حذف       │
└──────────────┘
```

---

## 5️⃣ مخطط العميل (Customer Flow)

```
[زائر الموقع]
     │
     │ 1. يزور الموقع
     ▼
[HomePage]
     │
     ├─── يتصفح الفئات → [CategoriesExplorerPage]
     │
     ├─── يتصفح المنتجات → [ProductsPage]
     │
     └─── يبحث عن منتج → [Search]
     │
     │ 2. يختار منتج
     ▼
[ProductDetailPage]
     │
     │ 3. يضيف للسلة
     ▼
[CartContext.addItem()]
     │
     │ 4. يحفظ في localStorage
     ▼
[localStorage]
     │
     │ 5. يذهب للسلة
     ▼
[CartPage]
     │
     │ 6. يراجع الطلب
     ▼
[CheckoutPage]
     │
     │ 7. يملأ البيانات
     │    - الاسم
     │    - الهاتف
     │    - المدينة
     │    - العنوان
     ▼
[ordersService.create()]
     │
     │ 8. يحفظ الطلب
     ▼
[Database]
     │
     │ 9. يرسل واتساب
     ▼
[WhatsApp]
     │
     │ 10. صفحة النجاح
     ▼
[OrderSuccessPage]
     │
     │ 11. يمكن التتبع
     ▼
[TrackOrderPage]
```

---

## 6️⃣ مخطط الاستيراد (Import Flow)

```
[Admin]
     │
     │ 1. يدخل رابط المنتج
     ▼
[StoreImportPage]
     │
     │ 2. يرسل طلب API
     ▼
[api/scrape.ts]
     │
     ├─── Strategy 0: Shein Specialized
     │         │
     │         ├─── ✅ نجح → يرجع البيانات
     │         │
     │         └─── ❌ فشل → Strategy 1
     │
     ├─── Strategy 1: Direct Fetch
     │         │
     │         ├─── ✅ نجح → يحلل HTML
     │         │
     │         └─── ❌ فشل → Strategy 2
     │
     ├─── Strategy 2: Firecrawl API
     │         │
     │         ├─── ✅ نجح → يرجع JSON
     │         │
     │         └─── ❌ فشل → Strategy 3
     │
     ├─── Strategy 3: Jina.ai Reader
     │         │
     │         ├─── ✅ نجح → يحول لـ Markdown
     │         │
     │         └─── ❌ فشل → Strategy 4
     │
     └─── Strategy 4: CORS Proxy
               │
               ├─── ✅ نجح → يحلل HTML
               │
               └─── ❌ فشل → يرجع فارغ
     │
     │ 3. يرجع البيانات
     ▼
[Response: {title, price, images, sizes, colors}]
     │
     │ 4. يملأ النموذج تلقائياً
     ▼
[AddProductPage (pre-filled)]
     │
     │ 5. Admin يراجع ويعدل
     ▼
[productsService.create()]
     │
     │ 6. يحفظ في قاعدة البيانات
     ▼
[Database]
```

---

## 7️⃣ مخطط الأمان (Security Flow)

```
[User Request]
     │
     │ 1. يرسل طلب
     ▼
[Frontend]
     │
     │ 2. يضيف JWT Token
     ▼
[Supabase Client]
     │
     │ 3. يرسل للسيرفر
     ▼
[Supabase Server]
     │
     │ 4. يتحقق من Token
     ▼
[JWT Verification]
     │
     ├─── ✅ Valid → يستمر
     │
     └─── ❌ Invalid → 401 Unauthorized
     │
     │ 5. يتحقق من RLS
     ▼
[RLS Policy Check]
     │
     ├─── SELECT: يتحقق من is_visible أو role
     │
     ├─── INSERT: يتحقق من role = 'admin'
     │
     ├─── UPDATE: يتحقق من role = 'admin'
     │
     └─── DELETE: يتحقق من role = 'admin'
     │
     ├─── ✅ Allowed → ينفذ العملية
     │
     └─── ❌ Denied → 403 Forbidden
     │
     │ 6. يرجع النتيجة
     ▼
[Response]
```

### Rate Limiting:

```
[API Request]
     │
     │ 1. يصل للـ API
     ▼
[api/_middleware.ts]
     │
     │ 2. يتحقق من IP
     ▼
[Rate Limit Check]
     │
     │ 3. يحسب الطلبات
     ▼
[Request Counter]
     │
     ├─── < 10 requests/min → ✅ يسمح
     │
     └─── ≥ 10 requests/min → ❌ 429 Too Many Requests
     │
     │ 4. يرجع النتيجة
     ▼
[Response + X-RateLimit-Remaining header]
```

---

## 8️⃣ مخطط النشر (Deployment Flow)

```
[Developer]
     │
     │ 1. git push origin main
     ▼
[GitHub Repository]
     │
     │ 2. Webhook trigger
     ▼
[Vercel]
     │
     │ 3. يبدأ Build
     ▼
[Build Process]
     │
     ├─── npm install
     │
     ├─── tsc -b (TypeScript)
     │
     └─── vite build (Production)
     │
     │ 4. ينشئ dist/
     ▼
[Static Files + Serverless Functions]
     │
     │ 5. ينشر على CDN
     ▼
[Vercel Edge Network]
     │
     │ 6. يصبح متاح
     ▼
[https://your-domain.vercel.app]
```

### Environment Variables:

```
[Vercel Dashboard]
     │
     │ 1. يضيف المتغيرات
     ▼
[Environment Variables]
     │
     ├─── VITE_SUPABASE_URL
     ├─── VITE_SUPABASE_ANON_KEY
     ├─── FIRECRAWL_API_KEY
     └─── VITE_GEMINI_API_KEY
     │
     │ 2. يحقنها في Build
     ▼
[Build Time]
     │
     │ 3. تصبح متاحة في الكود
     ▼
[import.meta.env.VITE_*]
```

---

## 9️⃣ مخطط الحالة (State Management)

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Context Providers                     │
└─────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ AuthContext  │    │ CartContext  │    │ThemeContext  │
│              │    │              │    │              │
│ - user       │    │ - items[]    │    │ - theme      │
│ - login()    │    │ - addItem()  │    │ - toggle()   │
│ - logout()   │    │ - remove()   │    │              │
│ - isAdmin    │    │ - clear()    │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ localStorage │    │ localStorage │    │ localStorage │
│ 'user'       │    │ 'cart'       │    │ 'theme'      │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🔟 مخطط الأخطاء والحلول (Error Handling)

```
[Operation]
     │
     │ 1. يحاول العملية
     ▼
[Try Block]
     │
     ├─── ✅ Success → يرجع data
     │
     └─── ❌ Error → Catch Block
               │
               ▼
        [Error Type?]
               │
               ├─── Network Error
               │         │
               │         └─→ Retry 3 times
               │
               ├─── RLS Error (403)
               │         │
               │         └─→ Show "No Permission"
               │
               ├─── Not Found (404)
               │         │
               │         └─→ Show "Not Found"
               │
               ├─── Timeout
               │         │
               │         └─→ Use Fallback Data
               │
               └─── Unknown
                         │
                         └─→ Log + Show Generic Error
               │
               │ 2. يعرض رسالة
               ▼
        [Toast Notification]
```

---

## 📊 ملخص المخططات

### تم توضيح:
1. ✅ **البنية المعمارية الكاملة**
2. ✅ **قاعدة البيانات والعلاقات**
3. ✅ **تدفق البيانات**
4. ✅ **لوحة التحكم**
5. ✅ **رحلة العميل**
6. ✅ **نظام الاستيراد**
7. ✅ **الأمان والصلاحيات**
8. ✅ **عملية النشر**
9. ✅ **إدارة الحالة**
10. ✅ **معالجة الأخطاء**

---

**💡 هذه المخططات تساعدك على فهم النظام بشكل كامل!**
