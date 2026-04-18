-- ============================================
-- تفعيل عمليات CRUD كاملة للادمن
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor

-- 1. حذف السياسات القديمة
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "cities_admin_insert" ON cities;
DROP POLICY IF EXISTS "cities_admin_update" ON cities;
DROP POLICY IF EXISTS "cities_admin_delete" ON cities;
DROP POLICY IF EXISTS "currencies_admin_insert" ON currencies;
DROP POLICY IF EXISTS "currencies_admin_update" ON currencies;
DROP POLICY IF EXISTS "currencies_admin_delete" ON currencies;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;
DROP POLICY IF EXISTS "ads_admin_insert" ON ads;
DROP POLICY IF EXISTS "ads_admin_update" ON ads;
DROP POLICY IF EXISTS "ads_admin_delete" ON ads;

-- 2. إنشاء سياسات جديدة بدون قيود

-- Categories - الأقسام
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cities - المدن
CREATE POLICY "cities_admin_all" ON cities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Currencies - العملات
CREATE POLICY "currencies_admin_all" ON currencies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products - المنتجات
CREATE POLICY "products_admin_all" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Ads - الإعلانات
CREATE POLICY "ads_admin_all" ON ads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders - الطلبات
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ✅ تم! الآن الادمن يمكنه:
-- ✅ إضافة أقسام ومدن وعملات
-- ✅ تعديل أقسام ومدن وعملات
-- ✅ حذف أقسام ومدن وعملات
-- ✅ إضافة وتعديل وحذف منتجات
-- ✅ إضافة وتعديل وحذف إعلانات
-- ✅ إضافة وتعديل وحذف طلبات
