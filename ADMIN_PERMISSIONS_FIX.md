# 🔧 إصلاح مشكلة صلاحيات الأدمن

## 🚨 المشكلة

عند محاولة إضافة/تعديل/حذف المدن أو العملات أو الفئات في لوحة التحكم، لا يتم حفظ التغييرات.

**السبب**: صلاحيات RLS (Row Level Security) في Supabase غير مضبوطة بشكل صحيح.

---

## ✅ الحل

### **الخطوة 1: افتح Supabase SQL Editor**

1. اذهب إلى: https://supabase.com/dashboard
2. اختر مشروعك
3. من القائمة الجانبية: **SQL Editor**
4. اضغط **"New query"**

### **الخطوة 2: شغّل الكود التالي**

انسخ والصق محتوى الملف:
```
supabase/fix_all_admin_permissions.sql
```

أو استخدم هذا الكود المختصر:

```sql
-- إصلاح صلاحيات المدن
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
DROP POLICY IF EXISTS "Public Read Cities" ON cities;

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

-- إصلاح صلاحيات العملات
DROP POLICY IF EXISTS "Admin Write Currencies" ON currencies;
DROP POLICY IF EXISTS "Public Read Currencies" ON currencies;

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
```

### **الخطوة 3: اضغط "Run"**

انتظر حتى تظهر رسالة "Success" ✅

### **الخطوة 4: جرب الآن!**

ارجع إلى لوحة التحكم وجرب:
- إضافة مدينة جديدة
- تعديل مدينة موجودة
- حذف مدينة

**يجب أن تعمل الآن!** 🎉

---

## 📊 ما تم إصلاحه

### ✅ **المدن (Cities)**
- ✅ الإضافة
- ✅ التعديل
- ✅ الحذف
- ✅ تفعيل/تعطيل

### ✅ **العملات (Currencies)**
- ✅ الإضافة
- ✅ التعديل
- ✅ الحذف

### ✅ **الفئات (Categories)**
- ✅ الإضافة
- ✅ التعديل
- ✅ الحذف

### ✅ **المنتجات (Products)**
- ✅ الإضافة
- ✅ التعديل
- ✅ الحذف
- ✅ إخفاء/إظهار

### ✅ **الإعلانات (Ads)**
- ✅ الإضافة
- ✅ التعديل
- ✅ الحذف
- ✅ تفعيل/تعطيل

### ✅ **الطلبات (Orders)**
- ✅ عرض جميع الطلبات
- ✅ تعديل حالة الطلب
- ✅ حذف الطلب

---

## 🔍 التحقق من الصلاحيات

بعد تشغيل الكود، يمكنك التحقق من الصلاحيات بهذا الاستعلام:

```sql
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('cities', 'currencies', 'categories', 'products', 'ads', 'orders')
ORDER BY tablename, cmd;
```

يجب أن ترى:
- **SELECT**: للقراءة
- **INSERT**: للإضافة
- **UPDATE**: للتعديل
- **DELETE**: للحذف

---

## 🐛 إذا لم تعمل

### **1. تحقق من دور المستخدم (Role)**

```sql
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

يجب أن يكون `role = 'admin'`

### **2. تحقق من RLS مفعّل**

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('cities', 'currencies');
```

يجب أن يكون `rowsecurity = true`

### **3. تحقق من Console (F12)**

افتح Console في المتصفح وشاهد الأخطاء:
- إذا رأيت `403 Forbidden` → مشكلة في الصلاحيات
- إذا رأيت `401 Unauthorized` → مشكلة في تسجيل الدخول
- إذا رأيت `500 Internal Server Error` → مشكلة في السيرفر

---

## 📞 الدعم

إذا استمرت المشكلة:

1. **تحقق من Supabase Logs**:
   - اذهب إلى: Dashboard → Logs → Postgres Logs
   - ابحث عن أخطاء RLS

2. **تحقق من Network في المتصفح**:
   - افتح DevTools (F12)
   - اذهب إلى Network
   - جرب إضافة مدينة
   - شاهد الـ Response

3. **أعد تسجيل الدخول**:
   - اخرج من لوحة التحكم
   - سجل دخول مرة أخرى
   - جرب مرة أخرى

---

## ✅ الخلاصة

**المشكلة**: صلاحيات RLS غير صحيحة

**الحل**: تشغيل `fix_all_admin_permissions.sql`

**النتيجة**: جميع عمليات الإضافة/التعديل/الحذف تعمل الآن! 🎉

---

**🚀 الآن يمكنك إدارة المدن والعملات والفئات بدون مشاكل!**
