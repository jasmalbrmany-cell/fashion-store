# 📸 دليل مصور خطوة بخطوة

## 🎯 الهدف: إصلاح صلاحيات لوحة التحكم

---

## 📋 الخطوة 1: افتح Supabase

### **1.1 اذهب إلى:**
```
https://supabase.com/dashboard
```

### **1.2 سجل دخول**
- استخدم حسابك

### **1.3 اختر مشروعك**
- اسم المشروع: **jkxfcyngiuefvaxswjxg**
- أو أي اسم آخر لمشروعك

---

## 📋 الخطوة 2: افتح SQL Editor

### **2.1 من القائمة الجانبية:**
```
اضغط على: SQL Editor
```

### **2.2 أنشئ استعلام جديد:**
```
اضغط على: "New query"
```

يجب أن ترى شاشة فارغة لكتابة الكود

---

## 📋 الخطوة 3: انسخ الكود

### **3.1 افتح الملف:**
```
extracted_project/supabase/fix_all_admin_permissions.sql
```

### **3.2 انسخ كل المحتوى**
- اضغط Ctrl+A (تحديد الكل)
- اضغط Ctrl+C (نسخ)

### **3.3 الصق في Supabase SQL Editor**
- اضغط Ctrl+V (لصق)

---

## 📋 الخطوة 4: شغّل الكود

### **4.1 اضغط زر "Run"**
```
الزر الأخضر في الأسفل: "Run" ▶️
```

### **4.2 انتظر...**
```
يجب أن ترى: "Running query..."
```

### **4.3 تحقق من النتيجة:**

**✅ إذا نجح:**
```
Success
Rows: 0
```

**❌ إذا فشل:**
```
Error: policy "..." already exists
```

**الحل:** امسح الكود القديم وانسخ الكود من `URGENT_FIX_NOW.md`

---

## 📋 الخطوة 5: تحقق من الصلاحيات

### **5.1 شغّل هذا الاستعلام:**

```sql
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('cities', 'currencies', 'store_settings')
ORDER BY tablename;
```

### **5.2 يجب أن ترى:**

```
cities | Everyone can view active cities
cities | Admins can view all cities
cities | Admins can insert cities
cities | Admins can update cities
cities | Admins can delete cities

currencies | Everyone can view currencies
currencies | Admins can insert currencies
currencies | Admins can update currencies
currencies | Admins can delete currencies

store_settings | Everyone can view settings
store_settings | Admins can insert settings
store_settings | Admins can update settings
```

---

## 📋 الخطوة 6: تحقق من دور المستخدم

### **6.1 شغّل هذا الاستعلام:**

```sql
SELECT id, email, role 
FROM profiles 
WHERE email = 'بريدك_الإلكتروني_هنا';
```

**استبدل `بريدك_الإلكتروني_هنا` ببريدك الفعلي!**

### **6.2 يجب أن ترى:**

```
id: xxx-xxx-xxx
email: your@email.com
role: admin  ← يجب أن يكون admin
```

### **6.3 إذا لم يكن admin:**

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'بريدك_الإلكتروني_هنا';
```

---

## 📋 الخطوة 7: أعد تسجيل الدخول

### **7.1 اخرج من لوحة التحكم**
```
اضغط زر "تسجيل الخروج"
```

### **7.2 امسح الـ Cache**
```
1. اضغط Ctrl+Shift+Delete
2. اختر "Cached images and files"
3. اضغط "Clear data"
```

### **7.3 سجل دخول مرة أخرى**
```
اذهب إلى: /login
سجل دخول بحسابك
```

---

## 📋 الخطوة 8: اختبر المدن

### **8.1 اذهب إلى:**
```
/admin/cities
```

### **8.2 أضف مدينة جديدة:**
```
1. اضغط "إضافة مدينة"
2. الاسم: "تعز"
3. تكلفة الشحن: 3000
4. اضغط "حفظ"
```

### **8.3 أعد تحميل الصفحة:**
```
اضغط F5
```

### **8.4 تحقق:**
```
✅ يجب أن تظهر "تعز" في القائمة
❌ إذا لم تظهر: ارجع للخطوة 6 وتحقق من الدور
```

---

## 📋 الخطوة 9: اختبر الإعدادات

### **9.1 اذهب إلى:**
```
/admin/settings
```

### **9.2 غيّر رقم الواتساب:**
```
1. اكتب: 777123456
2. اضغط "حفظ الإعدادات"
```

### **9.3 أعد تحميل الصفحة:**
```
اضغط F5
```

### **9.4 تحقق:**
```
✅ يجب أن يبقى الرقم: 777123456
❌ إذا رجع للقديم: ارجع للخطوة 4 وشغّل الكود مرة أخرى
```

---

## 📋 الخطوة 10: أنشئ Supabase Storage Bucket

### **10.1 من القائمة الجانبية:**
```
اضغط على: Storage
```

### **10.2 أنشئ Bucket جديد:**
```
1. اضغط "Create a new bucket"
2. Name: products
3. Public: ✅ (مهم جداً!)
4. اضغط "Create bucket"
```

### **10.3 تحقق:**
```
✅ يجب أن ترى bucket اسمه "products"
```

---

## 📋 الخطوة 11: اختبر الاستيراد الموحد

### **11.1 اذهب إلى:**
```
/admin/products/unified-import
```

### **11.2 الصق رابط منتج:**
```
مثال: https://pletino.com/product/123
```

### **11.3 اضغط "استيراد"**
```
انتظر... (قد يستغرق 10-30 ثانية)
```

### **11.4 راجع البيانات:**
```
✅ يجب أن ترى:
- اسم المنتج
- الوصف
- السعر
- الصور
- الفئة المقترحة
```

### **11.5 اضغط "حفظ المنتج"**

### **11.6 تحقق:**
```
1. اذهب إلى: /admin/products
2. يجب أن ترى المنتج الجديد ✅
3. اذهب إلى: / (الصفحة الرئيسية)
4. يجب أن يظهر المنتج للعملاء ✅
```

---

## ✅ قائمة التحقق النهائية:

- [ ] شغّلت SQL في Supabase
- [ ] رأيت رسالة "Success"
- [ ] تحققت من الصلاحيات
- [ ] تحققت من دور المستخدم (admin)
- [ ] أعدت تسجيل الدخول
- [ ] مسحت الـ Cache
- [ ] اختبرت المدن (تُحفظ ✅)
- [ ] اختبرت الإعدادات (تبقى ✅)
- [ ] أنشأت Bucket "products"
- [ ] اختبرت الاستيراد (يعمل ✅)

---

## 🎉 إذا نجحت جميع الاختبارات:

**مبروك!** 🎊

النظام الآن:
- ✅ المدن تُحفظ للأبد
- ✅ الإعدادات تبقى كما هي
- ✅ العملات تتعدل
- ✅ المنتجات تُستورد وتُحفظ
- ✅ الصور تُرفع إلى Supabase
- ✅ جميع التغييرات دائمة
- ✅ النظام في أفضل حال

---

## 🐛 إذا لم ينجح:

### **المشكلة: "Success" لكن المدن لا تُحفظ**

**السبب:** دور المستخدم ليس admin

**الحل:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'بريدك@هنا.com';
```

### **المشكلة: "Error: policy already exists"**

**السبب:** السياسات موجودة بالفعل

**الحل:** استخدم الكود من `URGENT_FIX_NOW.md` (يحذف القديم أولاً)

### **المشكلة: "Bucket not found"**

**السبب:** لم تنشئ Bucket

**الحل:** ارجع للخطوة 10

---

**🚀 ابدأ من الخطوة 1 الآن!**
