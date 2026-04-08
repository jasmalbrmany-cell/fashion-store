-- ============================================
-- Fashion Hub Store - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'editor', 'viewer', 'customer')),
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES categories(id),
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
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

-- Cities table
CREATE TABLE public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currencies table
CREATE TABLE public.currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    exchange_rate NUMERIC NOT NULL DEFAULT 1,
    symbol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
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

-- Ads table
CREATE TABLE public.ads (
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

-- Activity logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store settings table
CREATE TABLE public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Fashion Hub',
    logo TEXT,
    currency TEXT DEFAULT 'YER',
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_visible ON products(is_visible);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON profiles FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Categories policies
CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage categories"
    ON categories FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Products policies
CREATE POLICY "Visible products are viewable by everyone"
    ON products FOR SELECT USING (is_visible = true OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    ));

CREATE POLICY "Admins and editors can manage products"
    ON products FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Cities policies
CREATE POLICY "Cities are viewable by everyone"
    ON cities FOR SELECT USING (true);

CREATE POLICY "Admins can manage cities"
    ON cities FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Currencies policies
CREATE POLICY "Currencies are viewable by everyone"
    ON currencies FOR SELECT USING (true);

CREATE POLICY "Admins can manage currencies"
    ON currencies FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view their own orders"
    ON orders FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins and editors can view all orders"
    ON orders FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins and editors can update orders"
    ON orders FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor')
        )
    );

-- Ads policies
CREATE POLICY "Active ads are viewable by everyone"
    ON ads FOR SELECT USING (is_active = true OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage ads"
    ON ads FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Activity logs policies
CREATE POLICY "Activity logs are viewable by admins only"
    ON activity_logs FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert activity logs"
    ON activity_logs FOR INSERT WITH CHECK (true);

-- Store settings policies
CREATE POLICY "Store settings are viewable by everyone"
    ON store_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage store settings"
    ON store_settings FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_currencies_updated_at
    BEFORE UPDATE ON currencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
    BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at
    BEFORE UPDATE ON store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'customer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_user_name TEXT,
    p_action TEXT,
    p_details TEXT
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (user_id, user_name, action, details)
    VALUES (p_user_id, p_user_name, p_action, p_details)
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (id, name, icon, "order") VALUES
    ('c0000000-0000-0000-0000-000000000001', 'ملابس نسائية', 'Shirt', 1),
    ('c0000000-0000-0000-0000-000000000002', 'ملابس رجالية', 'Shirt', 2),
    ('c0000000-0000-0000-0000-000000000003', 'أحذية', 'Footprints', 3),
    ('c0000000-0000-0000-0000-000000000004', 'إكسسوارات', 'Watch', 4),
    ('c0000000-0000-0000-0000-000000000005', 'حقائب', 'Briefcase', 5),
    ('c0000000-0000-0000-0000-000000000006', 'عطور', 'Flower', 6);

-- Insert default cities
INSERT INTO cities (name, shipping_cost) VALUES
    ('صنعاء', 3000),
    ('عدن', 5000),
    ('تعز', 4000),
    ('الحديدة', 4500),
    ('حضرموت', 6000);

-- Insert default currencies
INSERT INTO currencies (code, name, exchange_rate, symbol) VALUES
    ('YER', 'ريال يمني', 1, 'ر.ي'),
    ('SAR', 'ريال سعودي', 0.075, 'ر.س'),
    ('USD', 'دولار أمريكي', 0.004, '$');

-- Insert sample products
INSERT INTO products (id, name, description, price, category_id, images, sizes, colors, stock, is_visible) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'فستان سهرة طويل', 'فستان سهرة أنيق للمناسبات الخاصة، مصنوع من الحرير الطبيعي', 45000, 'c0000000-0000-0000-0000-000000000001',
     '[{"id": "img-1", "url": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500", "isPrimary": true}, {"id": "img-2", "url": "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500", "isPrimary": false}]',
     '[{"id": "size-1", "name": "S", "stock": 5, "priceModifier": 0}, {"id": "size-2", "name": "M", "stock": 8, "priceModifier": 0}, {"id": "size-3", "name": "L", "stock": 3, "priceModifier": 0}, {"id": "size-4", "name": "XL", "stock": 2, "priceModifier": 500}]',
     '[{"id": "color-1", "name": "أحمر", "hex": "#DC2626", "stock": 6}, {"id": "color-2", "name": "أزرق", "hex": "#2563EB", "stock": 5}, {"id": "color-3", "name": "أسود", "hex": "#1F2937", "stock": 7}]',
     18, true),
    ('e0000000-0000-0000-0000-000000000002', 'بدلة رجالية كلاسيكية', 'بدلة رسمية للرجال، مثالية للمناسبات الرسمية والأعمال', 85000, 'c0000000-0000-0000-0000-000000000002',
     '[{"id": "img-3", "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500", "isPrimary": true}]',
     '[{"id": "size-5", "name": "48", "stock": 4, "priceModifier": 0}, {"id": "size-6", "name": "50", "stock": 6, "priceModifier": 0}, {"id": "size-7", "name": "52", "stock": 5, "priceModifier": 0}]',
     '[{"id": "color-4", "name": "رمادي", "hex": "#6B7280", "stock": 8}, {"id": "color-5", "name": "كحلي", "hex": "#1E3A5F", "stock": 6}]',
     15, true),
    ('e0000000-0000-0000-0000-000000000003', 'حذاء رياضي حديث', 'حذاء رياضي مريح للرياضة واليومي، بتصميم عصري', 35000, 'c0000000-0000-0000-0000-000000000003',
     '[{"id": "img-5", "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500", "isPrimary": true}]',
     '[{"id": "size-9", "name": "40", "stock": 10, "priceModifier": 0}, {"id": "size-10", "name": "41", "stock": 8, "priceModifier": 0}, {"id": "size-11", "name": "42", "stock": 12, "priceModifier": 0}]',
     '[{"id": "color-7", "name": "أبيض", "hex": "#FFFFFF", "stock": 20}, {"id": "color-8", "name": "أسود", "hex": "#1F2937", "stock": 15}]',
     30, true),
    ('e0000000-0000-0000-0000-000000000004', 'شنطة يد فاخرة', 'شنطة يد من الجلد الطبيعي، مثالية للاستخدام اليومي', 55000, 'c0000000-0000-0000-0000-000000000005',
     '[{"id": "img-7", "url": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500", "isPrimary": true}]',
     '[{"id": "size-14", "name": "صغير", "stock": 5, "priceModifier": 0}, {"id": "size-15", "name": "متوسط", "stock": 8, "priceModifier": 0}, {"id": "size-16", "name": "كبير", "stock": 3, "priceModifier": 2000}]',
     '[{"id": "color-10", "name": "بني", "hex": "#92400E", "stock": 6}, {"id": "color-11", "name": "أسود", "hex": "#1F2937", "stock": 7}]',
     16, true),
    ('e0000000-0000-0000-0000-000000000005', 'ساعة يد ذهبية', 'ساعة يد أنيقة بذهب إستانلس، مقاومة للماء', 75000, 'c0000000-0000-0000-0000-000000000004',
     '[{"id": "img-9", "url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500", "isPrimary": true}]',
     '[{"id": "size-17", "name": "عادي", "stock": 15, "priceModifier": 0}]',
     '[{"id": "color-13", "name": "ذهبي", "hex": "#F59E0B", "stock": 10}, {"id": "color-14", "name": "فضي", "hex": "#9CA3AF", "stock": 5}]',
     15, true),
    ('e0000000-0000-0000-0000-000000000006', 'عطر أو دو تواليت', 'عطر رجالي منعش، تدوم رائحته لأكثر من 8 ساعات', 28000, 'c0000000-0000-0000-0000-000000000006',
     '[{"id": "img-11", "url": "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500", "isPrimary": true}]',
     '[{"id": "size-18", "name": "50 مل", "stock": 20, "priceModifier": 0}, {"id": "size-19", "name": "100 مل", "stock": 15, "priceModifier": 15000}]',
     '[]',
     35, true);

-- Insert sample ads
INSERT INTO ads (title, type, content, image_url, position, is_active, "order") VALUES
    ('خصم 20% على جميع الفساتين', 'image', 'خصم 20% على جميع الفساتين النسائية', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200', 'top', true, 1),
    ('عروض رمضان', 'image', 'عروض خاصة بمناسبة رمضان', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200', 'bottom', true, 2);

-- Insert default store settings
INSERT INTO store_settings (name, currency, social_links) VALUES (
    'فاشن هاب',
    'YER',
    '{"whatsapp": "967777123456", "whatsappCategory": {}, "facebook": "https://facebook.com/fashionhub", "instagram": "https://instagram.com/fashionhub", "tiktok": "https://tiktok.com/@fashionhub", "email": "info@fashionhub.com", "website": "https://fashionhub.com"}'
);

-- ============================================
-- VIEWS
-- ============================================

-- View for statistics
CREATE OR REPLACE VIEW public.statistics AS
SELECT
    (SELECT COUNT(*) FROM products WHERE is_visible = true) as total_products,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
    (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_orders,
    (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_orders,
    (SELECT COUNT(*) FROM profiles WHERE role = 'customer') as total_customers,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed') as total_revenue;
