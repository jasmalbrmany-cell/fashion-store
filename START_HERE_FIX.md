# ⚡ ابدأ هنا - إصلاح سريع (دقيقة واحدة)

## 🚨 المشكلة
- المدن لا تُحفظ
- الإعدادات (الأرقام والروابط) ترجع للقديمة
- العملات لا تتعدل
- أي تغيير في لوحة التحكم يختفي

## ✅ الحل (3 خطوات فقط)

### **1. افتح Supabase SQL Editor**
https://supabase.com/dashboard → مشروعك → SQL Editor → New query

### **2. انسخ والصق هذا الكود:**

```sql
-- إصلاح المدن
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
CREATE POLICY "Admins can insert cities" ON cities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update cities" ON cities FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete cities" ON cities FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- إصلاح العملات
DROP POLICY IF EXISTS "Admin Write Currencies" ON currencies;
CREATE POLICY "Admins can insert currencies" ON currencies FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update currencies" ON currencies FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete currencies" ON currencies FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- إصلاح الإعدادات (الأهم!)
DROP POLICY IF EXISTS "Admin Write Settings" ON store_settings;
CREATE POLICY "Admins can insert settings" ON store_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update settings" ON store_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- إنشاء سجل إعدادات افتراضي
INSERT INTO store_settings (id, name, logo, currency, social_links, is_maintenance_mode)
VALUES ('settings_main', 'Fashion Hub', '', 'YER', '{"whatsapp": "967", "email": "", "instagram": "", "facebook": "", "tiktok": "", "whatsappCategory": {}}'::jsonb, false)
ON CONFLICT (id) DO NOTHING;
```

### **3. اضغط "Run"** ▶️

---

## 🎉 تم!

الآن:
- ✅ المدن تُحفظ للأبد
- ✅ الإعدادات تبقى كما هي
- ✅ العملات تتعدل
- ✅ جميع التغييرات دائمة

---

## 🧪 اختبر الآن:

1. اذهب إلى `/admin/settings`
2. غيّر رقم الواتساب
3. اضغط حفظ
4. **أعد تحميل الصفحة (F5)**
5. يجب أن يبقى الرقم الجديد ✅

---

## 📁 للحل الكامل:

إذا أردت إصلاح **كل شيء** (المنتجات، الفئات، الإعلانات، الطلبات):

شغّل الملف الكامل:
```
supabase/fix_all_admin_permissions.sql
```

---

**🚀 الآن شغّل الكود وجرب!**
