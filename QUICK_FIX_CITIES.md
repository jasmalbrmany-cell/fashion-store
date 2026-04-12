# ⚡ إصلاح سريع - مشكلة المدن

## 🚨 المشكلة
المدن لا تُحفظ/تُحذف/تُعدّل في لوحة التحكم

## ✅ الحل السريع (دقيقة واحدة)

### **1. افتح Supabase SQL Editor**
https://supabase.com/dashboard → اختر مشروعك → SQL Editor → New query

### **2. انسخ والصق هذا الكود:**

```sql
-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
DROP POLICY IF EXISTS "Public Read Cities" ON cities;

-- إنشاء سياسات جديدة صحيحة
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
```

### **3. اضغط "Run"**

### **4. جرب الآن!**
ارجع إلى `/admin/cities` وجرب إضافة/تعديل/حذف مدينة

---

## 🎉 تم!

الآن يمكنك:
- ✅ إضافة مدن جديدة
- ✅ تعديل المدن الموجودة
- ✅ حذف المدن
- ✅ تفعيل/تعطيل المدن

**التغييرات دائمة ولن تختفي عند الخروج!** 🚀

---

## 📝 ملاحظة

إذا كنت تواجه نفس المشكلة مع **العملات** أو **الفئات**، شغّل:
```
supabase/fix_all_admin_permissions.sql
```

هذا الملف يصلح جميع الصلاحيات دفعة واحدة! ✨
