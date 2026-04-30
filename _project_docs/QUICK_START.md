# ⚡ البدء السريع - 5 دقائق فقط!

## 🎯 الهدف
تشغيل المشروع محلياً في 5 دقائق

---

## 📋 المتطلبات
- Node.js 18+ مثبت
- pnpm مثبت (`npm install -g pnpm`)
- حساب Supabase (مجاني)

---

## 🚀 الخطوات (5 دقائق)

### 1️⃣ إصلاح قاعدة البيانات (دقيقة واحدة)

```bash
# 1. افتح https://app.supabase.com
# 2. اختر مشروعك
# 3. اذهب إلى SQL Editor
# 4. انسخ محتوى: supabase/fix_permissions.sql
# 5. اضغط Run
```

✅ **تم!** الآن قاعدة البيانات جاهزة

---

### 2️⃣ إعداد المتغيرات (دقيقة واحدة)

```bash
# تأكد أن ملف .env موجود ويحتوي على:
VITE_SUPABASE_URL=https://jkxfcyngiuefvaxswjxg.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_APP_NAME=Fashion Hub
VITE_WHATSAPP_DEFAULT=967777123456
```

✅ **تم!** المتغيرات جاهزة

---

### 3️⃣ تثبيت التبعيات (دقيقتان)

```bash
cd extracted_project
pnpm install
```

✅ **تم!** التبعيات مثبتة

---

### 4️⃣ تشغيل المشروع (10 ثواني)

```bash
pnpm dev
```

✅ **تم!** المشروع يعمل على http://localhost:5173

---

## 🎉 مبروك!

المشروع الآن يعمل! افتح المتصفح:
```
http://localhost:5173
```

---

## 🧪 اختبار سريع

### 1. الصفحة الرئيسية
- يجب أن ترى المنتجات
- يجب أن تعمل القوائم

### 2. تسجيل الدخول
```
Email: admin@fashionhub.com
Password: demo123
```

### 3. لوحة التحكم
```
http://localhost:5173/admin
```

---

## ❓ مشاكل شائعة

### المشكلة: "Cannot find module"
```bash
rm -rf node_modules
pnpm install
```

### المشكلة: "placeholder.supabase.co"
```bash
# تأكد من .env يحتوي على VITE_SUPABASE_URL الصحيح
```

### المشكلة: Port 5173 مستخدم
```bash
# أغلق التطبيق الآخر أو استخدم port آخر:
pnpm dev -- --port 3000
```

---

## 📚 الخطوة التالية

بعد التشغيل المحلي:
1. اقرأ `DEPLOYMENT.md` للنشر
2. اقرأ `SECURITY.md` للأمان
3. اقرأ `README.md` للتفاصيل

---

## ⏱️ الوقت المستغرق

- ✅ إصلاح قاعدة البيانات: 1 دقيقة
- ✅ إعداد المتغيرات: 1 دقيقة
- ✅ تثبيت التبعيات: 2 دقيقة
- ✅ تشغيل المشروع: 10 ثواني
- ✅ **المجموع: ~5 دقائق**

---

**🚀 استمتع بمشروعك!**
