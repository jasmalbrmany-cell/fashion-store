# 🚀 دليل البدء - Fashion Hub Store

**آخر تحديث:** 18 أبريل 2026  
**الحالة:** جاري الإصلاح والتحسين

---

## ⚠️ إجراءات فورية (CRITICAL)

### 1. إعادة تعيين مفاتيح Supabase
**الأولوية:** 🔴 حرجة جداً

```bash
# 1. اذهب إلى Supabase Dashboard
https://app.supabase.com/project/jkxfcyngiuefvaxswjxg/settings/api

# 2. اضغط "Reset" بجانب anon key

# 3. انسخ المفتاح الجديد

# 4. حدّث .env.local بالمفتاح الجديد
nano .env.local
# VITE_SUPABASE_ANON_KEY=your-new-key-here

# 5. احذف الملف من Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch extracted_project/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 6. فرض Push
git push origin --force --all
```

### 2. التحقق من .gitignore
```bash
# تأكد أن .env.local في .gitignore
grep ".env.local" extracted_project/.gitignore

# إذا لم يكن موجود، أضفه
echo ".env.local" >> extracted_project/.gitignore
```

---

## 📋 الإصلاحات المطبقة

### ✅ تم الإصلاح
- [x] **CORS Security** - تحديد الأصول المسموحة فقط
- [x] **Rate Limiting** - إضافة تتبع المستخدمين
- [x] **Input Validation** - إضافة Zod schemas (`api/validators.ts`)
- [x] **Error Handling** - إنشاء AppError class (`api/errors.ts`)
- [x] **Caching System** - نظام caching مع TTL (`api/cache.ts`)

### 🔄 جاري الإصلاح
- [ ] API Refactoring - تقسيم ملفات كبيرة
- [ ] Database Optimization - تحسين الاستعلامات
- [ ] Logging System - إضافة نظام logging
- [ ] Testing Framework - إضافة اختبارات

---

## 🛠️ الملفات الجديدة

### 1. `api/validators.ts`
**الغرض:** التحقق من صحة المدخلات
```typescript
import { validateInput, ImportProductSchema } from '@/api/validators';

const result = validateInput(ImportProductSchema, { url: 'https://...' });
if (result.valid) {
  // استخدم result.data
}
```

### 2. `api/errors.ts`
**الغرض:** معالجة الأخطاء بشكل موحد
```typescript
import { AppError, ValidationError, formatError } from '@/api/errors';

throw new ValidationError('البيانات غير صحيحة');
// أو
const errorResponse = formatError(error);
```

### 3. `api/cache.ts`
**الغرض:** نظام caching مع TTL
```typescript
import { cacheManager, withCache } from '@/api/cache';

// استخدام مباشر
cacheManager.set('key', data, 3600000); // 1 ساعة
const cached = cacheManager.get('key');

// استخدام decorator
const cachedFn = withCache(myFunction, 3600000);
```

---

## 🚀 البدء بالتطوير

### 1. تثبيت المتطلبات
```bash
cd extracted_project
pnpm install
```

### 2. إعداد متغيرات البيئة
```bash
# انسخ ملف المثال
cp .env.example .env.local

# ملأ القيم الحقيقية
nano .env.local
```

### 3. تشغيل خادم التطوير
```bash
pnpm dev
```

### 4. بناء للإنتاج
```bash
pnpm build
pnpm build:prod  # مع متغيرات الإنتاج
```

---

## 📊 هيكل المشروع

```
extracted_project/
├── api/                    # API endpoints (Vercel serverless)
│   ├── _middleware.ts      # Rate limiting, CORS
│   ├── validators.ts       # ✅ جديد - التحقق من المدخلات
│   ├── errors.ts           # ✅ جديد - معالجة الأخطاء
│   ├── cache.ts            # ✅ جديد - نظام caching
│   ├── catalog.ts          # استيراد المنتجات
│   ├── scrape.ts           # scraping منتج واحد
│   └── _lib/               # مكتبات مساعدة
├── src/
│   ├── pages/              # صفحات React
│   ├── components/         # مكونات React
│   ├── context/            # React Context
│   ├── services/           # خدمات API
│   ├── lib/                # مكتبات مساعدة
│   ├── types/              # تعريفات TypeScript
│   └── App.tsx             # المكون الرئيسي
├── supabase/               # ملفات قاعدة البيانات
│   └── schema.sql          # schema الرئيسي
├── public/                 # ملفات ثابتة
└── package.json            # المتطلبات
```

---

## 🔒 الأمان

### ✅ تم تطبيقه
- [x] CORS محدد للأصول المسموحة
- [x] Rate limiting (10 طلبات/دقيقة)
- [x] RLS policies في Supabase
- [x] Input validation مع Zod
- [x] Error handling آمن
- [x] .env في .gitignore

### ⚠️ يجب الانتباه
- ❌ لا تشارك ملف `.env` أبداً
- ❌ لا ترفع المفاتيح السرية إلى Git
- ✅ استخدم `.env.local` للتطوير
- ✅ استخدم Environment Variables في Vercel

---

## 📈 الأداء

### تحسينات مطبقة
- ✅ Lazy loading للصفحات
- ✅ Code splitting مع Vite
- ✅ Caching system مع TTL
- ✅ Rate limiting لحماية API

### تحسينات مخطط لها
- [ ] Image optimization
- [ ] Database query optimization
- [ ] Redis caching (للإنتاج)
- [ ] CDN للملفات الثابتة

---

## 🧪 الاختبار

### اختبار محلي
```bash
# تشغيل خادم التطوير
pnpm dev

# فتح المتصفح
http://localhost:5173
```

### اختبار الإنتاج
```bash
# بناء للإنتاج
pnpm build

# معاينة الإنتاج
pnpm preview
```

### اختبار API
```bash
# اختبار Rate Limiting
curl -X POST http://localhost:3000/api/catalog \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# اختبار Validation
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"invalid-url"}'  # يجب أن يرجع خطأ
```

---

## 🚀 النشر على Vercel

### 1. ربط مع GitHub
```bash
git add .
git commit -m "Security fixes and improvements"
git push origin main
```

### 2. إعداد Vercel
- اذهب إلى [vercel.com](https://vercel.com)
- اضغط "New Project"
- اختر المستودع من GitHub

### 3. إضافة Environment Variables
في Vercel Dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-key
VITE_APP_NAME=Fashion Hub
VITE_WHATSAPP_DEFAULT=967777123456
```

### 4. Deploy
- اضغط "Deploy"
- انتظر حتى يكتمل البناء

---

## 📞 الدعم والمساعدة

### المشاكل الشائعة

**المشكلة:** "placeholder.supabase.co" error
```
الحل: تأكد من إضافة VITE_SUPABASE_URL في Environment Variables
```

**المشكلة:** Build fails
```bash
# نظف وأعد البناء
rm -rf node_modules dist
pnpm install
pnpm build
```

**المشكلة:** API returns 429
```
الحل: هذا طبيعي - Rate Limiting يعمل! انتظر دقيقة وحاول مرة أخرى
```

---

## 📚 الموارد

- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zod Validation](https://zod.dev)

---

## ✅ قائمة التحقق قبل النشر

- [ ] إعادة تعيين مفاتيح Supabase
- [ ] حذف `.env.local` من Git history
- [ ] تحديث `.gitignore`
- [ ] اختبار البناء محلياً (`pnpm build`)
- [ ] اختبار الصفحات الرئيسية
- [ ] اختبار تسجيل الدخول
- [ ] اختبار لوحة التحكم
- [ ] إضافة Environment Variables في Vercel
- [ ] اختبار النشر

---

**🎉 مبروك! أنت جاهز للبدء!**

للمزيد من المعلومات، راجع:
- `FIXES_APPLIED.md` - الإصلاحات المطبقة
- `SECURITY.md` - دليل الأمان
- `DEPLOYMENT.md` - دليل النشر
