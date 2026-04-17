# 🔧 إصلاح Vercel يدوياً - Manual Vercel Fix

## ❌ **المشكلة:**
Vercel يستمر في استخدام `pnpm` رغم وجود `.npmrc`

---

## ✅ **الحل - يجب تنفيذه يدوياً في Vercel Dashboard:**

### **الخطوة 1: تغيير إعدادات المشروع**

1. اذهب إلى: https://vercel.com/jasmalbrmany-cell/fashion-store/settings

2. اضغط على **"General"**

3. ابحث عن **"Build & Development Settings"**

4. غيّر الإعدادات إلى:

```
Framework Preset: Other
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

5. اضغط **"Save"**

---

### **الخطوة 2: إضافة Environment Variables**

1. اذهب إلى: https://vercel.com/jasmalbrmany-cell/fashion-store/settings/environment-variables

2. أضف المتغيرات التالية:

```
VITE_SUPABASE_URL
Value: https://jkxfcyngiuefvaxswjxg.supabase.co
Environment: Production, Preview, Development

VITE_SUPABASE_ANON_KEY
Value: <المفتاح الجديد بعد إعادة التعيين>
Environment: Production, Preview, Development

VITE_APP_NAME
Value: Fashion Hub
Environment: Production, Preview, Development

VITE_WHATSAPP_DEFAULT
Value: 967777123456
Environment: Production, Preview, Development
```

⚠️ **مهم جداً:** استخدم المفتاح الجديد بعد إعادة تعيين Supabase!

---

### **الخطوة 3: إعادة النشر**

1. اذهب إلى: https://vercel.com/jasmalbrmany-cell/fashion-store

2. اضغط على **"Deployments"**

3. اضغط على أحدث deployment

4. اضغط على **"⋯"** (ثلاث نقاط)

5. اختر **"Redeploy"**

6. **مهم:** اختر **"Use existing Build Cache" = NO**

7. اضغط **"Redeploy"**

---

## 📸 **صور توضيحية:**

### **Build Settings:**
```
┌─────────────────────────────────────────┐
│ Framework Preset: Other                 │
│ Build Command: npm run build            │
│ Output Directory: dist                  │
│ Install Command: npm install            │
│ Development Command: npm run dev        │
└─────────────────────────────────────────┘
```

---

## ✅ **ما يجب أن تراه بعد النجاح:**

```
✓ Cloning completed
✓ Running "npm install"
✓ Detected package.json
✓ Installing dependencies
✓ Running "npm run build"
✓ Build completed
✓ Deployment ready
```

---

## 🚨 **إذا استمرت المشكلة:**

### **الحل البديل: استخدام Vercel CLI**

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
cd extracted_project
vercel --prod

# اتبع التعليمات على الشاشة
```

---

## 📋 **قائمة التحقق:**

- [ ] تغيير Build Command إلى `npm run build`
- [ ] تغيير Install Command إلى `npm install`
- [ ] إضافة جميع Environment Variables
- [ ] إعادة تعيين Supabase keys
- [ ] إعادة النشر مع Clear Cache
- [ ] التحقق من نجاح البناء

---

**🎯 بعد تنفيذ هذه الخطوات، يجب أن يعمل الموقع بنجاح!**
