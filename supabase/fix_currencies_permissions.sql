-- ============================================
-- إصلاح صلاحيات جدول العملات (Currencies)
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor

-- 1. حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "Public Read Currencies" ON currencies;
DROP POLICY IF EXISTS "Admin Write Currencies" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;
DROP POLICY IF EXISTS "Everyone can view currencies" ON currencies;

-- 2. السماح للجميع بقراءة العملات (للعملاء في صفحة المنتجات)
CREATE POLICY "Everyone can view currencies"
  ON currencies FOR SELECT
  USING (true);

-- 3. السماح للأدمن بإضافة عملات جديدة
CREATE POLICY "Admins can insert currencies"
  ON currencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. السماح للأدمن بتعديل العملات
CREATE POLICY "Admins can update currencies"
  ON currencies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. السماح للأدمن بحذف العملات
CREATE POLICY "Admins can delete currencies"
  ON currencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. التحقق من السياسات
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
WHERE tablename = 'currencies'
ORDER BY policyname;

-- ✅ تم! الآن يمكن للأدمن إضافة/تعديل/حذف العملات
