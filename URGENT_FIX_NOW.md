# 🚨 إصلاح عاجل - اتبع هذه الخطوات بالضبط!

## ❌ المشكلة الحالية:

أنت **لم تشغل كود SQL في Supabase بعد!**

الملفات التي رفعناها على GitHub هي فقط **توثيق**. 
يجب عليك **تشغيل الكود في Supabase يدوياً** لإصلاح الصلاحيات!

---

## ✅ الحل (5 دقائق):

### **الخطوة 1️⃣: افتح Supabase SQL Editor**

1. اذهب إلى: **https://supabase.com/dashboard**
2. سجل دخول
3. اختر مشروعك: **jkxfcyngiuefvaxswjxg**
4. من القائمة الجانبية: اضغط **SQL Editor**
5. اضغط **"New query"**

---

### **الخطوة 2️⃣: انسخ والصق هذا الكود بالضبط:**

```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Everyone can view active cities" ON cities;
DROP POLICY IF EXISTS "Admins can view all cities" ON cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
DROP POLICY IF EXISTS "Public Read Cities" ON cities;

DROP POLICY IF EXISTS "Everyone can view currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can insert currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can update currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can delete currencies" ON currencies;
DROP POLICY IF EXISTS "Admin Write Currencies" ON currencies;
DROP POLICY IF EXISTS "Public Read Currencies" ON currencies;

DROP POLICY IF EXISTS "Everyone can view settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON store_settings;
DROP POLICY IF EXISTS "Admin Write Settings" ON store_settings;
DROP POLICY IF EXISTS "Public Read Settings" ON store_settings;

DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Admin Write Categories" ON categories;

DROP POLICY IF EXISTS "Everyone can view visible products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Admin Write Products" ON products;

-- إنشاء السياسات الجديدة الصحيحة

-- المدن
CREATE POLICY "Everyone can view active cities"
  ON cities FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all cities"
  ON cities FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- العملات
CREATE POLICY "Everyone can view currencies"
  ON currencies FOR SELECT USING (true);

CREATE POLICY "Admins can insert currencies"
  ON currencies FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update currencies"
  ON currencies FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete currencies"
  ON currencies FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- الفئات
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- المنتجات
CREATE POLICY "Everyone can view visible products"
  ON products FOR SELECT USING (is_visible = true);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- الإعدادات
CREATE POLICY "Everyone can view settings"
  ON store_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert settings"
  ON store_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update settings"
  ON store_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- إنشاء سجل إعدادات افتراضي
INSERT INTO store_settings (id, name, logo, currency, social_links, is_maintenance_mode)
VALUES (
  'settings_main',
  'Fashion Hub',
  '',
  'YER',
  '{"whatsapp": "967", "email": "", "instagram": "", "facebook": "", "tiktok": "", "whatsappCategory": {}}'::jsonb,
  false
)
ON CONFLICT (id) DO NOTHING;
```

---

### **الخطوة 3️⃣: اضغط "Run"** ▶️

يجب أن ترى رسالة **"Success"** ✅

---

### **الخطوة 4️⃣: أعد تسجيل الدخول**

1. اخرج من لوحة التحكم
2. امسح الـ Cache: **Ctrl+Shift+Delete**
3. سجل دخول مرة أخرى

---

### **الخطوة 5️⃣: اختبر الآن!**

**اختبار المدن:**
```
1. /admin/cities
2. أضف مدينة: "تعز"
3. احفظ
4. أعد تحميل (F5)
5. يجب أن تظهر "تعز" ✅
```

**اختبار الإعدادات:**
```
1. /admin/settings
2. غيّر رقم الواتساب
3. احفظ
4. أعد تحميل (F5)
5. يجب أن يبقى الرقم الجديد ✅
```

---

## 🔍 إذا لم يعمل بعد تشغيل SQL:

### **تحقق من دور المستخدم:**

شغّل هذا في Supabase SQL Editor:

```sql
SELECT id, email, role FROM profiles WHERE email = 'بريدك_الإلكتروني_هنا';
```

يجب أن يكون `role = 'admin'`

إذا لم يكن admin، شغّل:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'بريدك_الإلكتروني_هنا';
```

---

## 📊 ملخص المشكلة:

| المشكلة | السبب | الحل |
|---------|-------|------|
| المدن لا تُحفظ | صلاحيات RLS خاطئة | شغّل SQL في Supabase |
| الإعدادات ترجع | صلاحيات RLS خاطئة | شغّل SQL في Supabase |
| تسجيل الخروج لا يعمل | كود قديم | تم إصلاحه في GitHub |
| الاستيراد لا يظهر | لم تنشئ Bucket | أنشئ Bucket في Supabase |

---

## 🎯 الخطوات بالترتيب:

1. ✅ **شغّل SQL في Supabase** (الأهم!)
2. ✅ أعد تسجيل الدخول
3. ✅ اختبر المدن والإعدادات
4. ✅ أنشئ Bucket للصور
5. ✅ اختبر الاستيراد

---

## 💡 ملاحظة مهمة جداً:

**GitHub و Vercel لا يصلحان الصلاحيات!**

الصلاحيات موجودة في **قاعدة بيانات Supabase**.

يجب عليك **تشغيل كود SQL في Supabase يدوياً** لإصلاحها!

---

**🚨 الآن افتح Supabase SQL Editor وشغّل الكود!**

**📞 أخبرني بعد تشغيل الكود: هل ظهرت رسالة "Success"؟**
