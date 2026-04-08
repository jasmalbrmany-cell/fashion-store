-- ======================================================
-- Fashion Hub - Complete Admin Auto-Setup
-- Run ALL of this in Supabase SQL Editor
-- ======================================================

-- STEP 1: Confirm the admin email and set role
-- (Run this first)
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'daoodalhashdi@gmail.com';

-- STEP 2: Create or update admin profile
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'داود الهاشدي') as name,
  'admin' as role,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'daoodalhashdi@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin',
  updated_at = NOW();

-- STEP 3: Create trigger to auto-create profile for ANY new user
-- (so every new user gets a profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from metadata if set, otherwise 'customer'
  user_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'customer'
  );

  -- Insert profile
  INSERT INTO public.profiles (id, email, name, role, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role,
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Auto-confirm email
  UPDATE auth.users
  SET email_confirmed_at = NOW(), confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Confirm ALL existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = NOW(), confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- STEP 5: Create profiles for ALL existing auth users who don't have a profile
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
  CASE 
    WHEN u.email = 'daoodalhashdi@gmail.com' THEN 'admin'
    ELSE COALESCE(u.raw_app_meta_data->>'role', u.raw_user_meta_data->>'role', 'customer')
  END as role,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 6: Verify everything is correct
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as "Email Confirmed",
  p.name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
