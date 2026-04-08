-- ======================================================
-- Fashion Hub - Admin Setup Script for Supabase
-- Run this in Supabase SQL Editor to fix admin login
-- ======================================================

-- 1. Disable email confirmation requirement (run in Supabase Dashboard > Auth > Settings)
-- OR use this approach: confirm email for a specific user

-- 2. Update user role in profiles table
-- Replace 'YOUR_ADMIN_EMAIL@example.com' with the actual admin email
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- 3. If profile doesn't exist for the user, create it manually
-- First get the user id from auth.users, then insert:
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)) as name,
  'admin' as role,
  now(),
  now()
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = now();

-- 4. Confirm email for admin user (bypass email confirmation)
UPDATE auth.users
SET email_confirmed_at = now(), confirmed_at = now()
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- 5. Verify the setup
SELECT u.email, u.email_confirmed_at, p.role, p.name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'YOUR_ADMIN_EMAIL@example.com';

-- ======================================================
-- Auto-confirm trigger: run once to auto-confirm all new users
-- (Optional: removes need for email confirmation)
-- ======================================================
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(), confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS auto_confirm_on_signup ON auth.users;
CREATE TRIGGER auto_confirm_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
