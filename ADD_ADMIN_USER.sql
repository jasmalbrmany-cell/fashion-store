-- ============================================
-- إضافة مستخدم الادمن
-- ============================================
-- شغّل هذا الكود في Supabase SQL Editor

-- 1. أولاً، تحقق من وجود المستخدم في auth.users
-- (يجب أن يكون المستخدم قد سجل دخول مرة واحدة على الأقل)

-- 2. احصل على UUID المستخدم من Supabase Dashboard:
-- اذهب إلى: Authentication > Users
-- ابحث عن: daoodalhashdi@gmail.com
-- انسخ UUID الخاص به

-- 3. استبدل 'YOUR_USER_UUID_HERE' بـ UUID الفعلي وشغّل هذا الكود:

-- تحديث دور المستخدم إلى admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'daoodalhashdi@gmail.com';

-- إضافة صلاحيات الادمن الكاملة
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
SELECT 
    id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
FROM public.profiles
WHERE email = 'daoodalhashdi@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    can_manage_products = true,
    can_manage_orders = true,
    can_manage_users = true,
    can_manage_ads = true,
    can_manage_cities = true,
    can_manage_currencies = true,
    can_view_reports = true,
    can_export_data = true;

-- التحقق من النتيجة
SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    up.can_manage_products,
    up.can_manage_orders,
    up.can_manage_users,
    up.can_manage_ads
FROM public.profiles p
LEFT JOIN public.user_permissions up ON p.id = up.user_id
WHERE p.email = 'daoodalhashdi@gmail.com';

-- ✅ تم! الآن يجب أن تتمكن من الدخول كـ admin
