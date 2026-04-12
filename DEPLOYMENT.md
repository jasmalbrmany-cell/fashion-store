# 🚀 دليل النشر - Fashion Hub Store

## ✅ قبل النشر - قائمة التحقق

### 1. إعداد قاعدة البيانات Supabase

#### الخطوة 1: تشغيل Schema الرئيسي
```sql
-- في Supabase SQL Editor، قم بتشغيل:
-- supabase/schema.sql
```

#### الخطوة 2: إصلاح جدول الصلاحيات (إذا لزم الأمر)
```sql
-- في Supabase SQL Editor، قم بتشغيل:
-- supabase/fix_permissions.sql
```

#### الخطوة 3: التحقق من الجداول
تأكد من وجود الجداول التالية:
- ✅ profiles
- ✅ categories
- ✅ products
- ✅ cities
- ✅ currencies
- ✅ orders
- ✅ ads
- ✅ activity_logs
- ✅ user_permissions
- ✅ store_settings

### 2. إعداد متغيرات البيئة

#### للتطوير المحلي:
```bash
# انسخ ملف .env.example إلى .env
cp .env.example .env

# ثم املأ القيم الحقيقية
```

#### للنشر على Vercel:
أضف المتغيرات التالية في Vercel Dashboard:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Fashion Hub
VITE_WHATSAPP_DEFAULT=967777123456
FIRECRAWL_API_KEY=your-firecrawl-key (اختياري)
VITE_GEMINI_API_KEY=your-gemini-key (اختياري)
```

---

## 🌐 النشر على Vercel

### الطريقة 1: من خلال Git (موصى به)

1. **ارفع الكود إلى GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **اربط مع Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - اضغط "New Project"
   - اختر المستودع من GitHub
   - Vercel سيكتشف إعدادات Vite تلقائياً

3. **أضف متغيرات البيئة**
   - في Vercel Dashboard → Settings → Environment Variables
   - أضف جميع المتغيرات المذكورة أعلاه

4. **Deploy**
   - اضغط "Deploy"
   - انتظر حتى يكتمل البناء (2-3 دقائق)

### الطريقة 2: من خلال Vercel CLI

```bash
# ثبت Vercel CLI
npm i -g vercel

# سجل دخول
vercel login

# انشر
vercel

# للنشر على الإنتاج
vercel --prod
```

---

## 🔒 الأمان - مهم جداً!

### ✅ تم تطبيقه:
- ✅ Rate Limiting على API endpoints (10 طلبات/دقيقة)
- ✅ CORS headers محكمة
- ✅ RLS policies في Supabase
- ✅ .env في .gitignore

### ⚠️ تأكد من:
- ❌ **لا تشارك** ملف `.env` أبداً
- ❌ **لا ترفع** المفاتيح السرية إلى Git
- ✅ استخدم `.env.local` للتطوير المحلي
- ✅ استخدم Environment Variables في Vercel

---

## 🧪 اختبار بعد النشر

### 1. اختبار الصفحة الرئيسية
```
https://your-domain.vercel.app
```
يجب أن تظهر المنتجات

### 2. اختبار تسجيل الدخول
```
https://your-domain.vercel.app/login
```
جرب تسجيل الدخول بحساب Admin

### 3. اختبار لوحة التحكم
```
https://your-domain.vercel.app/admin
```
يجب أن تعمل جميع الصفحات

### 4. اختبار API
```bash
# اختبار Rate Limiting
curl -X POST https://your-domain.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة: "placeholder.supabase.co" error
**الحل**: تأكد من إضافة `VITE_SUPABASE_URL` في Environment Variables

### المشكلة: Build fails
**الحل**: 
```bash
# نظف وأعد البناء
rm -rf node_modules dist
pnpm install
pnpm build
```

### المشكلة: API returns 429 (Too Many Requests)
**الحل**: هذا طبيعي - Rate Limiting يعمل! انتظر دقيقة وحاول مرة أخرى

### المشكلة: Permissions not working
**الحل**: شغل `supabase/fix_permissions.sql` في Supabase SQL Editor

---

## 📊 المراقبة

### Vercel Analytics
- مفعّل تلقائياً
- راقب الأداء من Vercel Dashboard

### Supabase Logs
- اذهب إلى Supabase Dashboard → Logs
- راقب Database queries و Auth events

---

## 🔄 التحديثات المستقبلية

### لتحديث الموقع:
```bash
git add .
git commit -m "Update: description"
git push origin main
```
Vercel سينشر التحديث تلقائياً!

---

## 📞 الدعم

إذا واجهت مشاكل:
1. تحقق من Vercel Logs
2. تحقق من Supabase Logs
3. تحقق من Browser Console

---

## ✅ قائمة التحقق النهائية

قبل النشر، تأكد من:
- [ ] تم تشغيل `schema.sql` في Supabase
- [ ] تم تشغيل `fix_permissions.sql` في Supabase
- [ ] تم إضافة جميع Environment Variables في Vercel
- [ ] تم اختبار البناء محلياً (`pnpm build`)
- [ ] تم رفع الكود إلى Git
- [ ] ملف `.env` غير موجود في Git
- [ ] تم اختبار الموقع بعد النشر

---

**🎉 مبروك! موقعك جاهز للعمل!**
