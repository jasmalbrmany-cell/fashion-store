-- ============================================================
-- 🔑 إنشاء/إصلاح حساب الأدمن — شغّل هذا في SQL Editor
-- ============================================================
-- البريد: daoodalhashdi@gmail.com
-- كلمة المرور: da112233
-- ============================================================

-- الخطوة 1: تأكيد تفعيل البريد (إذا كان الحساب موجوداً)
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  raw_app_meta_data  = raw_app_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'daoodalhashdi@gmail.com';

-- الخطوة 2: تحديث دور المستخدم في جدول profiles
UPDATE public.profiles
SET
  role = 'admin',
  name = COALESCE(NULLIF(name,''), 'داود الهاشدي')
WHERE email = 'daoodalhashdi@gmail.com';

-- الخطوة 3: إذا لم يكن في profiles (أضفه)
INSERT INTO public.profiles (id, email, name, role)
SELECT
  id,
  email,
  'داود الهاشدي',
  'admin'
FROM auth.users
WHERE email = 'daoodalhashdi@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      name = COALESCE(NULLIF(profiles.name,''), 'داود الهاشدي');

-- الخطوة 4: منح كامل الصلاحيات
INSERT INTO public.user_permissions (
  user_id,
  can_manage_products, can_manage_orders, can_manage_users,
  can_manage_ads, can_manage_cities, can_manage_currencies,
  can_view_reports, can_export_data
)
SELECT
  id, true, true, true, true, true, true, true, true
FROM auth.users
WHERE email = 'daoodalhashdi@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  can_manage_products  = true,
  can_manage_orders    = true,
  can_manage_users     = true,
  can_manage_ads       = true,
  can_manage_cities    = true,
  can_manage_currencies = true,
  can_view_reports     = true,
  can_export_data      = true;

-- ✅ تحقق من النتيجة — يجب أن تظهر سجل واحد بـ role = admin
SELECT
  p.email,
  p.name,
  p.role,
  u.email_confirmed_at IS NOT NULL AS email_confirmed,
  perm.can_manage_products
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_permissions perm ON perm.user_id = u.id
WHERE u.email = 'daoodalhashdi@gmail.com';
