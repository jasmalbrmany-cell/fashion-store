-- ============================================================
-- 🚀 FASHION HUB — الإصلاح الشامل لقاعدة البيانات
-- ============================================================
-- شغّل هذا الملف كاملاً في: Supabase → SQL Editor → New Query
-- ثم اضغط RUN
-- ============================================================
-- ============================================================
-- 1. إنشاء/إصلاح TRIGGER إنشاء Profile تلقائياً عند التسجيل
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (id, email, name, phone, role)
VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_app_meta_data->>'role', 'customer')
  ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, profiles.name),
  phone = COALESCE(EXCLUDED.phone, profiles.phone);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- إعادة إنشاء الـ trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ============================================================
-- 2. إضافة عمود is_maintenance_mode إذا لم يكن موجوداً
-- ============================================================
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'store_settings'
    AND column_name = 'is_maintenance_mode'
) THEN
ALTER TABLE store_settings
ADD COLUMN is_maintenance_mode BOOLEAN DEFAULT false;
END IF;
END $$;
-- ============================================================
-- 3. إنشاء سجل إعدادات افتراضي إذا لم يكن موجوداً
-- ============================================================
INSERT INTO store_settings (
    id,
    name,
    logo,
    currency,
    social_links,
    is_maintenance_mode
  )
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Fashion Hub',
    '',
    'YER',
    '{"whatsapp": "967777123456", "email": "", "instagram": "", "facebook": "", "tiktok": "", "whatsappCategory": {}}'::jsonb,
    false
  ) ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 4. إصلاح سياسات RLS — Profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR
SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR
INSERT WITH CHECK (
    auth.uid() = id
    OR auth.uid() IS NULL
  );
CREATE POLICY "profiles_update_own" ON profiles FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
-- ============================================================
-- 5. إصلاح RLS — Products
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Visible products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Admins and editors can manage products" ON products;
DROP POLICY IF EXISTS "Everyone can view visible products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "products_select_visible" ON products FOR
SELECT USING (is_visible = true);
CREATE POLICY "products_select_admin" ON products FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "products_insert_admin" ON products FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "products_update_admin" ON products FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "products_delete_admin" ON products FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
  )
);
-- ============================================================
-- 6. إصلاح RLS — Categories
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins and editors can manage categories" ON categories;
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR
SELECT USING (true);
CREATE POLICY "categories_insert_admin" ON categories FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "categories_update_admin" ON categories FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
  )
);
-- ============================================================
-- 7. إصلاح RLS — Cities
-- ============================================================
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON cities;
DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Everyone can view active cities" ON cities;
DROP POLICY IF EXISTS "Admins can view all cities" ON cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
CREATE POLICY "cities_select_all" ON cities FOR
SELECT USING (true);
CREATE POLICY "cities_insert_admin" ON cities FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "cities_update_admin" ON cities FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "cities_delete_admin" ON cities FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);
-- ============================================================
-- 8. إصلاح RLS — Currencies
-- ============================================================
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Currencies are viewable by everyone" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;
DROP POLICY IF EXISTS "Everyone can view currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can insert currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can update currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can delete currencies" ON currencies;
CREATE POLICY "currencies_select_all" ON currencies FOR
SELECT USING (true);
CREATE POLICY "currencies_insert_admin" ON currencies FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "currencies_update_admin" ON currencies FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "currencies_delete_admin" ON currencies FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);
-- ============================================================
-- 9. إصلاح RLS — Orders
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can update orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
-- أي شخص (حتى الزوار) يمكنه إنشاء طلب
CREATE POLICY "orders_insert_anyone" ON orders FOR
INSERT WITH CHECK (true);
-- العميل يرى طلباته فقط
CREATE POLICY "orders_select_own" ON orders FOR
SELECT USING (customer_id = auth.uid());
-- الأدمن والمحرر يرون كل الطلبات
CREATE POLICY "orders_select_admin" ON orders FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
-- الأدمن والمحرر يعدّلون الطلبات
CREATE POLICY "orders_update_admin" ON orders FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);
-- ============================================================
-- 10. إصلاح RLS — Ads
-- ============================================================
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active ads are viewable by everyone" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;
DROP POLICY IF EXISTS "Everyone can view active ads" ON ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON ads;
DROP POLICY IF EXISTS "Admins can insert ads" ON ads;
DROP POLICY IF EXISTS "Admins can update ads" ON ads;
DROP POLICY IF EXISTS "Admins can delete ads" ON ads;
CREATE POLICY "ads_select_active" ON ads FOR
SELECT USING (is_active = true);
CREATE POLICY "ads_select_admin" ON ads FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "ads_insert_admin" ON ads FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "ads_update_admin" ON ads FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "ads_delete_admin" ON ads FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);
-- ============================================================
-- 11. إصلاح RLS — Store Settings
-- ============================================================
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON store_settings;
DROP POLICY IF EXISTS "Admins can manage store settings" ON store_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON store_settings;
CREATE POLICY "settings_select_all" ON store_settings FOR
SELECT USING (true);
CREATE POLICY "settings_insert_admin" ON store_settings FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
CREATE POLICY "settings_update_admin" ON store_settings FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );
-- ============================================================
-- 12. إصلاح RLS — Activity Logs
-- ============================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activity logs are viewable by admins only" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
    )
  );
CREATE POLICY "activity_logs_insert_any" ON activity_logs FOR
INSERT WITH CHECK (true);
-- ============================================================
-- 13. إصلاح RLS — User Permissions
-- ============================================================
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;
CREATE POLICY "permissions_select_own" ON user_permissions FOR
SELECT USING (user_id = auth.uid());
CREATE POLICY "permissions_all_admin" ON user_permissions FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
);
-- ============================================================
-- 14. إنشاء صلاحيات كاملة للأدمن الحالي
-- ============================================================
INSERT INTO public.user_permissions (
    user_id,
    can_manage_products,
    can_manage_orders,
    can_manage_users,
    can_manage_ads,
    can_manage_cities,
    can_manage_currencies,
    can_view_reports,
    can_export_data
  )
SELECT id,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true
FROM public.profiles
WHERE role = 'admin' ON CONFLICT (user_id) DO
UPDATE
SET can_manage_products = true,
  can_manage_orders = true,
  can_manage_users = true,
  can_manage_ads = true,
  can_manage_cities = true,
  can_manage_currencies = true,
  can_view_reports = true,
  can_export_data = true;
-- ============================================================
-- 15. تأكيد بريد الأدمن تلقائياً (إذا لم يكن مؤكداً)
-- ============================================================
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE id IN (
    SELECT id
    FROM public.profiles
    WHERE role = 'admin'
  )
  AND email_confirmed_at IS NULL;
-- ============================================================
-- 16. التحقق من النتائج
-- ============================================================
SELECT p.email,
  p.role,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  perm.can_manage_products
FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.user_permissions perm ON perm.user_id = p.id
WHERE p.role = 'admin'
ORDER BY p.created_at;
-- ✅ انتهى! الآن:
-- ✅ الأدمن يستطيع الدخول
-- ✅ المستخدمون يستطيعون التسجيل
-- ✅ البيانات تُحفظ بشكل صحيح
-- ✅ الإحصاءات تعمل