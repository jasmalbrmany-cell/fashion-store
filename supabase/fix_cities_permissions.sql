-- ============================================
-- إصلاح صلاحيات جدول المدن (Cities)
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Public Read Cities" ON cities;
DROP POLICY IF EXISTS "Admin Write Cities" ON cities;
DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Everyone can view cities" ON cities;

-- 2. السماح للجميع بقراءة المدن النشطة (للعملاء في صفحة Checkout)
CREATE POLICY "Everyone can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

-- 3. السماح للأدمن بقراءة جميع المدن (نشطة وغير نشطة)
CREATE POLICY "Admins can view all cities"
  ON cities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. السماح للأدمن بإضافة مدن جديدة
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. السماح للأدمن بتعديل المدن
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. السماح للأدمن بحذف المدن
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. التحقق من السياسات
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cities'
ORDER BY policyname;

-- ✅ تم! الآن يمكن للأدمن إضافة/تعديل/حذف المدن
