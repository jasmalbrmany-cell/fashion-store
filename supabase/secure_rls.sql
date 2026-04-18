-- ============================================================
-- Fashion Hub - Secure Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor to secure the database.
-- ============================================================

-- 1. Ensure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing wide-open policies (from setup_complete.sql)
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_all_categories" ON categories;
DROP POLICY IF EXISTS "allow_all_products" ON products;
DROP POLICY IF EXISTS "allow_all_cities" ON cities;
DROP POLICY IF EXISTS "allow_all_currencies" ON currencies;
DROP POLICY IF EXISTS "allow_all_orders" ON orders;
DROP POLICY IF EXISTS "allow_all_ads" ON ads;
DROP POLICY IF EXISTS "allow_all_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "allow_all_store_settings" ON store_settings;

-- 3. Create SECURE Policies

-- PROFILES: Users can view/edit their own profile. Admins can view/edit all.
CREATE POLICY "Profiles are viewable by owner or admin" 
ON profiles FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CATEGORIES: Public can view. Admins/Editors can modify.
CREATE POLICY "Categories are viewable by everyone" 
ON categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert/update/delete categories" 
ON categories FOR ALL 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'))
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

-- PRODUCTS: Public can view visible products. Admins/Editors can modify all.
CREATE POLICY "Visible products viewable by everyone" 
ON products FOR SELECT 
USING (is_visible = true OR (auth.uid() IS NOT NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')));

CREATE POLICY "Admins can manage products" 
ON products FOR ALL 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'))
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

-- ORDERS: Customers can see their own orders. Admins can see/manage all.
-- Note: Unauthenticated users might create orders (if guest checkout is allowed). 
-- Allow inserts from everyone, but restrict selects.
CREATE POLICY "Anyone can create orders" 
ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view own orders or Admins view all" 
ON orders FOR SELECT 
USING (
  customer_id = auth.uid() OR 
  (auth.uid() IS NOT NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'))
);

CREATE POLICY "Admins can update orders" 
ON orders FOR UPDATE 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'))
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

-- CITIES & CURRENCIES: Public view, Admin modify.
CREATE POLICY "Cities viewable by everyone" ON cities FOR SELECT USING (true);
CREATE POLICY "Admins manage cities" ON cities FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Currencies viewable by everyone" ON currencies FOR SELECT USING (true);
CREATE POLICY "Admins manage currencies" ON currencies FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

-- ADS: Public view active, Admin manage all.
CREATE POLICY "Active ads viewable by everyone" 
ON ads FOR SELECT 
USING (is_active = true OR (auth.uid() IS NOT NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor')));

CREATE POLICY "Admins manage ads" ON ads FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

-- SETTINGS: Public view, Admin manage.
CREATE POLICY "Settings viewable by everyone" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON store_settings FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ACTIVITY LOGS: System functions insert, Admins view.
CREATE POLICY "Admins can view activity logs" 
ON activity_logs FOR SELECT 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

CREATE POLICY "Authenticated users can insert activity logs" 
ON activity_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- STORAGE SECURITY (Images)
DROP POLICY IF EXISTS "allow_all_storage" ON storage.objects;
CREATE POLICY "Public items are viewable by everyone" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'editor'));

SELECT 'Security Lockdown Complete! RLS strict policies are active.' as status;
