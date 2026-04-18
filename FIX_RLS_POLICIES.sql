-- ============================================
-- إصلاح سياسات RLS لجميع الجداول
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Users update own" ON profiles;
DROP POLICY IF EXISTS "Public read categories" ON categories;
DROP POLICY IF EXISTS "Admins manage categories" ON categories;
DROP POLICY IF EXISTS "Public read products" ON products;
DROP POLICY IF EXISTS "Admins manage products" ON products;
DROP POLICY IF EXISTS "Public read cities" ON cities;
DROP POLICY IF EXISTS "Admins manage cities" ON cities;
DROP POLICY IF EXISTS "Public read currencies" ON currencies;
DROP POLICY IF EXISTS "Admins manage currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone create orders" ON orders;
DROP POLICY IF EXISTS "Users read own orders" ON orders;
DROP POLICY IF EXISTS "Admins update orders" ON orders;
DROP POLICY IF EXISTS "Public read ads" ON ads;
DROP POLICY IF EXISTS "Admins manage ads" ON ads;
DROP POLICY IF EXISTS "Public read settings" ON store_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON store_settings;
DROP POLICY IF EXISTS "Admins read logs" ON activity_logs;
DROP POLICY IF EXISTS "System insert logs" ON activity_logs;
DROP POLICY IF EXISTS "Users read own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins manage permissions" ON user_permissions;

-- 2. إنشاء سياسات جديدة بسيطة وفعالة

-- Profiles
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_user_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- Categories
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_insert" ON categories FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_admin_update" ON categories FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "categories_admin_delete" ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_visible = true OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Cities
CREATE POLICY "cities_public_read" ON cities FOR SELECT USING (true);
CREATE POLICY "cities_admin_insert" ON cities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "cities_admin_update" ON cities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "cities_admin_delete" ON cities FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Currencies
CREATE POLICY "currencies_public_read" ON currencies FOR SELECT USING (true);
CREATE POLICY "currencies_admin_insert" ON currencies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "currencies_admin_update" ON currencies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "currencies_admin_delete" ON currencies FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders
CREATE POLICY "orders_public_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_user_read" ON orders FOR SELECT USING (
  customer_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "orders_admin_delete" ON orders FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Ads
CREATE POLICY "ads_public_read" ON ads FOR SELECT USING (is_active = true OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ads_admin_insert" ON ads FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ads_admin_update" ON ads FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "ads_admin_delete" ON ads FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Store Settings
CREATE POLICY "settings_public_read" ON store_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_insert" ON store_settings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "settings_admin_update" ON store_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Activity Logs
CREATE POLICY "logs_admin_read" ON activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (true);

-- User Permissions
CREATE POLICY "permissions_user_read" ON user_permissions FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "permissions_admin_insert" ON user_permissions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "permissions_admin_update" ON user_permissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ✅ تم! الآن جميع السياسات محدثة
-- يجب أن تظهر البيانات الآن في لوحة التحكم
