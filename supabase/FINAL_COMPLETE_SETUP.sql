-- ============================================================
-- 🚀 FASHION HUB — الإعداد الكامل النهائي لقاعدة البيانات
-- ============================================================
-- شغّل هذا الملف كاملاً في: Supabase → SQL Editor → New Query
-- ثم اضغط RUN ALL
-- ============================================================

-- ─── 1. جدول الملفات الشخصية ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin','editor','viewer','customer')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. جدول المنتجات ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category_id UUID,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  stock INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. جدول الأقسام ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. جدول المدن ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. جدول العملات ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. جدول الطلبات ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID REFERENCES auth.users(id),
  city TEXT NOT NULL,
  address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','waiting_payment','paid','approved','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. جدول الإعلانات ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image','video','text')),
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  link TEXT,
  position TEXT NOT NULL DEFAULT 'top' CHECK (position IN ('top','bottom','sidebar','inline','popup')),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. جدول إعدادات المتجر ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Fashion Hub',
  logo TEXT DEFAULT '',
  currency TEXT DEFAULT 'YER',
  social_links JSONB DEFAULT '{"whatsapp":"","email":"","instagram":"","facebook":"","tiktok":"","whatsappCategory":{}}'::jsonb,
  is_maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. جدول سجلات النشاط ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. جدول صلاحيات المستخدمين ──────────────────────────
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  can_manage_products BOOLEAN DEFAULT false,
  can_manage_orders BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_ads BOOLEAN DEFAULT false,
  can_manage_cities BOOLEAN DEFAULT false,
  can_manage_currencies BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. جدول المتاجر الخارجية ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.external_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT,
  password TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 12. جدول قواعد السكرابينج ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.store_scraping_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  price_selector TEXT,
  title_selector TEXT,
  image_selector TEXT,
  currency TEXT DEFAULT 'YER',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS — إنشاء Profile تلقائياً عند التسجيل
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_app_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name  = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA — بيانات أولية
-- ============================================================

-- إعدادات المتجر الافتراضية
INSERT INTO public.store_settings (id, name, logo, currency, social_links, is_maintenance_mode)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Fashion Hub',
  '',
  'YER',
  '{"whatsapp":"967777123456","email":"","instagram":"","facebook":"","tiktok":"","whatsappCategory":{}}'::jsonb,
  false
) ON CONFLICT (id) DO NOTHING;

-- عملة افتراضية
INSERT INTO public.currencies (code, name, symbol, exchange_rate)
VALUES ('YER', 'ريال يمني', 'ر.ي', 1)
ON CONFLICT (code) DO NOTHING;

-- مدن أساسية
INSERT INTO public.cities (name, shipping_cost, is_active) VALUES
  ('صنعاء', 500, true),
  ('عدن', 1000, true),
  ('تعز', 800, true),
  ('الحديدة', 900, true),
  ('إب', 700, true),
  ('ذمار', 750, true),
  ('حضرموت', 1500, true),
  ('مأرب', 1200, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY — سياسات الأمان
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_select_all"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select_visible" ON products;
DROP POLICY IF EXISTS "products_select_admin"   ON products;
DROP POLICY IF EXISTS "products_insert_admin"   ON products;
DROP POLICY IF EXISTS "products_update_admin"   ON products;
DROP POLICY IF EXISTS "products_delete_admin"   ON products;
CREATE POLICY "products_select_visible" ON products FOR SELECT USING (is_visible = true);
CREATE POLICY "products_select_admin"   ON products FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "products_insert_admin"   ON products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "products_update_admin"   ON products FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "products_delete_admin"   ON products FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all"    ON categories;
DROP POLICY IF EXISTS "categories_insert_admin"  ON categories;
DROP POLICY IF EXISTS "categories_update_admin"  ON categories;
DROP POLICY IF EXISTS "categories_delete_admin"  ON categories;
CREATE POLICY "categories_select_all"   ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- Cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cities_select_all"   ON cities;
DROP POLICY IF EXISTS "cities_insert_admin" ON cities;
DROP POLICY IF EXISTS "cities_update_admin" ON cities;
DROP POLICY IF EXISTS "cities_delete_admin" ON cities;
CREATE POLICY "cities_select_all"   ON cities FOR SELECT USING (true);
CREATE POLICY "cities_insert_admin" ON cities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cities_update_admin" ON cities FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "cities_delete_admin" ON cities FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Currencies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "currencies_select_all"   ON currencies;
DROP POLICY IF EXISTS "currencies_insert_admin" ON currencies;
DROP POLICY IF EXISTS "currencies_update_admin" ON currencies;
DROP POLICY IF EXISTS "currencies_delete_admin" ON currencies;
CREATE POLICY "currencies_select_all"   ON currencies FOR SELECT USING (true);
CREATE POLICY "currencies_insert_admin" ON currencies FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "currencies_update_admin" ON currencies FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "currencies_delete_admin" ON currencies FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_insert_anyone" ON orders;
DROP POLICY IF EXISTS "orders_select_own"    ON orders;
DROP POLICY IF EXISTS "orders_select_admin"  ON orders;
DROP POLICY IF EXISTS "orders_update_admin"  ON orders;
DROP POLICY IF EXISTS "orders_delete_admin"  ON orders;
CREATE POLICY "orders_insert_anyone" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_own"    ON orders FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "orders_select_admin"  ON orders FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "orders_update_admin"  ON orders FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "orders_delete_admin"  ON orders FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_select_active" ON ads;
DROP POLICY IF EXISTS "ads_select_admin"  ON ads;
DROP POLICY IF EXISTS "ads_insert_admin"  ON ads;
DROP POLICY IF EXISTS "ads_update_admin"  ON ads;
DROP POLICY IF EXISTS "ads_delete_admin"  ON ads;
CREATE POLICY "ads_select_active" ON ads FOR SELECT USING (is_active = true);
CREATE POLICY "ads_select_admin"  ON ads FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ads_insert_admin"  ON ads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ads_update_admin"  ON ads FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "ads_delete_admin"  ON ads FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Store Settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select_all"   ON store_settings;
DROP POLICY IF EXISTS "settings_insert_admin" ON store_settings;
DROP POLICY IF EXISTS "settings_update_admin" ON store_settings;
CREATE POLICY "settings_select_all"   ON store_settings FOR SELECT USING (true);
CREATE POLICY "settings_insert_admin" ON store_settings FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "settings_update_admin" ON store_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_logs_select_admin" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_insert_any"   ON activity_logs;
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));
CREATE POLICY "activity_logs_insert_any"   ON activity_logs FOR INSERT WITH CHECK (true);

-- User Permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_select_own" ON user_permissions;
DROP POLICY IF EXISTS "permissions_all_admin"  ON user_permissions;
CREATE POLICY "permissions_select_own" ON user_permissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "permissions_all_admin"  ON user_permissions FOR ALL  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- External Stores
ALTER TABLE public.external_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "external_stores_admin" ON external_stores;
CREATE POLICY "external_stores_admin" ON external_stores FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Scraping Rules
ALTER TABLE public.store_scraping_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scraping_rules_select" ON store_scraping_rules;
DROP POLICY IF EXISTS "scraping_rules_admin"  ON store_scraping_rules;
CREATE POLICY "scraping_rules_select" ON store_scraping_rules FOR SELECT USING (true);
CREATE POLICY "scraping_rules_admin"  ON store_scraping_rules FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- ADMIN PERMISSIONS — منح صلاحيات كاملة لكل المشرفين
-- ============================================================
INSERT INTO public.user_permissions (
  user_id, can_manage_products, can_manage_orders, can_manage_users,
  can_manage_ads, can_manage_cities, can_manage_currencies, can_view_reports, can_export_data
)
SELECT id, true, true, true, true, true, true, true, true
FROM public.profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO UPDATE SET
  can_manage_products  = true,
  can_manage_orders    = true,
  can_manage_users     = true,
  can_manage_ads       = true,
  can_manage_cities    = true,
  can_manage_currencies = true,
  can_view_reports     = true,
  can_export_data      = true;

-- ============================================================
-- تأكيد بريد الأدمن تلقائياً
-- ============================================================
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'admin')
  AND email_confirmed_at IS NULL;

-- ============================================================
-- تحقق نهائي — يجب أن تظهر نتائج
-- ============================================================
SELECT
  p.email,
  p.role,
  (u.email_confirmed_at IS NOT NULL) AS email_confirmed,
  perm.can_manage_products
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN public.user_permissions perm ON perm.user_id = p.id
WHERE p.role = 'admin';
