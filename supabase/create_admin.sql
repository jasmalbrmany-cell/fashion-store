-- ============================================
-- إنشاء حساب الأدمن الرئيسي
-- قم بتشغيل هذا الكود في SQL Editor بعد تشغيل schema.sql
-- ============================================

-- الخطوة 1: إنشاء المستخدم في نظام المصادقة
-- (يجب إنشاؤه يدوياً من Authentication > Users في لوحة Supabase)
-- البريد: daoodalhashdi@gmail.com
-- كلمة المرور: da112233

-- الخطوة 2: بعد الإنشاء، قم بتحديث صلاحيات المستخدم إلى أدمن
-- استبدل 'daoodalhashdi@gmail.com' ببريدك الصحيح
UPDATE public.profiles
SET role = 'admin',
    name = 'داود الهاشدي'
WHERE email = 'daoodalhashdi@gmail.com';

-- التحقق من النتيجة
SELECT id, email, name, role FROM public.profiles WHERE email = 'daoodalhashdi@gmail.com';
