-- ============================================
-- إصلاح شامل لجميع صلاحيات الأدمن
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor لإصلاح جميع المشاكل

-- ============================================
-- 1. إصلاح صلاحيات المدن (Cities)
-- ============================================

DROP POLICY IF EXISTS "Public Read Cities" ON cities;
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Everyone can view cities" ON cities;
DROP POLICY IF EXISTS "Everyone can view active cities" ON cities;
DROP POLICY IF EXISTS "Admins can view all cities" ON cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;

-- السماح للجميع بقراءة المدن النشطة
CREATE POLICY "Everyone can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

-- السماح للأدمن بقراءة جميع المدن
CREATE POLICY "Admins can view all cities"
  ON cities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بإضافة مدن
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل المدن
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف المدن
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 2. إصلاح صلاحيات العملات (Currencies)
-- ============================================

DROP POLICY IF EXISTS "Public Read Currencies" ON currencies;
DROP POLICY IF EXISTS "Admin Write Currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;
DROP POLICY IF EXISTS "Everyone can view currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can insert currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can update currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can delete currencies" ON currencies;

-- السماح للجميع بقراءة العملات
CREATE POLICY "Everyone can view currencies"
  ON currencies FOR SELECT
  USING (true);

-- السماح للأدمن بإضافة عملات
CREATE POLICY "Admins can insert currencies"
  ON currencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل العملات
CREATE POLICY "Admins can update currencies"
  ON currencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف العملات
CREATE POLICY "Admins can delete currencies"
  ON currencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. إصلاح صلاحيات الفئات (Categories)
-- ============================================

DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Admin Write Categories" ON categories;
DROP POLICY IF EXISTS "Admins and editors can manage categories" ON categories;
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- السماح للجميع بقراءة الفئات
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- السماح للأدمن بإضافة فئات
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل الفئات
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف الفئات
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 4. إصلاح صلاحيات المنتجات (Products)
-- ============================================

DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Admin Write Products" ON products;
DROP POLICY IF EXISTS "Admins and editors can manage products" ON products;
DROP POLICY IF EXISTS "Everyone can view visible products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- السماح للجميع بقراءة المنتجات المرئية
CREATE POLICY "Everyone can view visible products"
  ON products FOR SELECT
  USING (is_visible = true);

-- السماح للأدمن بقراءة جميع المنتجات
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بإضافة منتجات
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل المنتجات
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف المنتجات
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. إصلاح صلاحيات الإعلانات (Ads)
-- ============================================

DROP POLICY IF EXISTS "Public Read Ads" ON ads;
DROP POLICY IF EXISTS "Admin Write Ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;
DROP POLICY IF EXISTS "Everyone can view active ads" ON ads;
DROP POLICY IF EXISTS "Admins can view all ads" ON ads;
DROP POLICY IF EXISTS "Admins can insert ads" ON ads;
DROP POLICY IF EXISTS "Admins can update ads" ON ads;
DROP POLICY IF EXISTS "Admins can delete ads" ON ads;

-- السماح للجميع بقراءة الإعلانات النشطة
CREATE POLICY "Everyone can view active ads"
  ON ads FOR SELECT
  USING (is_active = true);

-- السماح للأدمن بقراءة جميع الإعلانات
CREATE POLICY "Admins can view all ads"
  ON ads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بإضافة إعلانات
CREATE POLICY "Admins can insert ads"
  ON ads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل الإعلانات
CREATE POLICY "Admins can update ads"
  ON ads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف الإعلانات
CREATE POLICY "Admins can delete ads"
  ON ads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 6. إصلاح صلاحيات الطلبات (Orders)
-- ============================================

DROP POLICY IF EXISTS "Admin Write Orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can update orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- السماح للعملاء بقراءة طلباتهم فقط
CREATE POLICY "Customers can view their orders"
  ON orders FOR SELECT
  USING (customer_id = auth.uid());

-- السماح للأدمن بقراءة جميع الطلبات
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للعملاء بإنشاء طلبات
CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- السماح للأدمن بإضافة طلبات
CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بتعديل الطلبات
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف الطلبات
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 7. إصلاح صلاحيات الإعدادات (Store Settings)
-- ============================================

DROP POLICY IF EXISTS "Public Read Settings" ON store_settings;
DROP POLICY IF EXISTS "Admin Write Settings" ON store_settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can view settings" ON store_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON store_settings;

-- السماح للجميع بقراءة الإعدادات الأساسية
CREATE POLICY "Everyone can view settings"
  ON store_settings FOR SELECT
  USING (true);

-- السماح للأدمن بتعديل الإعدادات (UPSERT = INSERT + UPDATE)
CREATE POLICY "Admins can insert settings"
  ON store_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON store_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 8. التحقق من جميع السياسات
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'قراءة'
    WHEN cmd = 'INSERT' THEN 'إضافة'
    WHEN cmd = 'UPDATE' THEN 'تعديل'
    WHEN cmd = 'DELETE' THEN 'حذف'
    WHEN cmd = 'ALL' THEN 'الكل'
  END as operation_ar
FROM pg_policies
WHERE tablename IN ('cities', 'currencies', 'categories', 'products', 'ads', 'orders', 'store_settings')
ORDER BY tablename, cmd, policyname;

-- ============================================
-- 9. إنشاء سجل إعدادات افتراضي إذا لم يكن موجوداً
-- ============================================

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

-- ✅ تم! الآن جميع صلاحيات الأدمن تعمل بشكل صحيح
-- يمكنك الآن إضافة/تعديل/حذف:
-- ✅ المدن
-- ✅ العملات
-- ✅ الفئات
-- ✅ المنتجات
-- ✅ الإعلانات
-- ✅ الطلبات
-- ✅ الإعدادات (الأرقام والروابط)
