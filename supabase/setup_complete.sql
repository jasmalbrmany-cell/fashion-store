-- ============================================================
-- Fashion Hub - Complete Database Setup
-- Run this in Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/jkxfcyngiuefvaxswjxg/sql
-- ============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables (skip if they exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'editor', 'viewer', 'customer')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES categories(id),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    stock INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    exchange_rate NUMERIC NOT NULL DEFAULT 1,
    symbol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    city TEXT NOT NULL,
    address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'waiting_payment', 'paid', 'approved', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('image', 'video', 'text')),
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    link TEXT,
    position TEXT DEFAULT 'top' CHECK (position IN ('top', 'bottom', 'sidebar', 'inline', 'popup')),
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'فاشن هاب',
    logo TEXT,
    currency TEXT DEFAULT 'YER',
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
DROP POLICY IF EXISTS "Admins and editors can manage categories" ON categories;
DROP POLICY IF EXISTS "Visible products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Admins and editors can manage products" ON products;
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON cities;
DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Currencies are viewable by everyone" ON currencies;
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins and editors can update orders" ON orders;
DROP POLICY IF EXISTS "Active ads are viewable by everyone" ON ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON ads;
DROP POLICY IF EXISTS "Activity logs are viewable by admins only" ON activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON store_settings;
DROP POLICY IF EXISTS "Admins can manage store settings" ON store_settings;

-- 5. Create OPEN policies (full access for now - admin controls from code)
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cities" ON cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_currencies" ON currencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ads" ON ads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- 6. Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
DROP TRIGGER IF EXISTS update_currencies_updated_at ON currencies;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
DROP TRIGGER IF EXISTS update_store_settings_updated_at ON store_settings;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON store_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. Seed default data (skip if already exists)
INSERT INTO categories (id, name, icon, "order") VALUES
    ('c0000000-0000-0000-0000-000000000001', 'ملابس نسائية', 'Shirt', 1),
    ('c0000000-0000-0000-0000-000000000002', 'ملابس رجالية', 'Shirt', 2),
    ('c0000000-0000-0000-0000-000000000003', 'أحذية', 'Footprints', 3),
    ('c0000000-0000-0000-0000-000000000004', 'إكسسوارات', 'Watch', 4),
    ('c0000000-0000-0000-0000-000000000005', 'حقائب', 'Briefcase', 5),
    ('c0000000-0000-0000-0000-000000000006', 'عطور', 'Flower', 6),
    ('c0000000-0000-0000-0000-000000000007', 'ملابس أطفال', 'Baby', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cities (name, shipping_cost, is_active) VALUES
    ('صنعاء', 3000, true),
    ('عدن', 5000, true),
    ('تعز', 4000, true),
    ('الحديدة', 4500, true),
    ('حضرموت', 6000, true)
ON CONFLICT DO NOTHING;

INSERT INTO currencies (code, name, exchange_rate, symbol) VALUES
    ('YER', 'ريال يمني', 1, 'ر.ي'),
    ('SAR', 'ريال سعودي', 0.075, 'ر.س'),
    ('USD', 'دولار أمريكي', 0.004, '$')
ON CONFLICT (code) DO NOTHING;

INSERT INTO store_settings (name, currency, social_links)
SELECT 'فاشن هاب', 'YER', '{"whatsapp":"967777123456","whatsappCategory":{},"facebook":"https://facebook.com/fashionhub","instagram":"https://instagram.com/fashionhub","tiktok":"https://tiktok.com/@fashionhub","email":"info@fashionhub.com"}'
WHERE NOT EXISTS (SELECT 1 FROM store_settings LIMIT 1);

-- 10. Create Storage bucket for product images (run separately if this fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy (allow all)
DROP POLICY IF EXISTS "allow_all_storage" ON storage.objects;
CREATE POLICY "allow_all_storage" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- Done!
SELECT 'Setup Complete! All tables and permissions configured.' as status;
