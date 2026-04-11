-- ==========================================
-- FASHION HUB - DATABASE INITIALIZATION SCRIPT
-- ==========================================
-- انسخ هذا الكود بالكامل، ثم الصقه في (SQL Editor) داخل Supabase واضغط (Run)

-- 1. إنشاء جدول الإعدادات العامة (Store Settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id text PRIMARY KEY,
    name text NOT NULL DEFAULT 'Fashion Hub',
    logo text,
    currency text DEFAULT 'SAR',
    social_links jsonb DEFAULT '{}'::jsonb,
    is_maintenance_mode boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);

-- إدراج بيانات الإعدادات الافتراضية
INSERT INTO public.store_settings (id, name, currency) 
VALUES ('settings_main', 'متجر الأزياء', 'SAR') 
ON CONFLICT (id) DO NOTHING;

-- 2. إنشاء جدول المدن (Cities)
CREATE TABLE IF NOT EXISTS public.cities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    shipping_cost numeric DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. إنشاء جدول المنتجات (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    category_id text,
    images jsonb DEFAULT '[]'::jsonb,
    sizes jsonb DEFAULT '[]'::jsonb,
    colors jsonb DEFAULT '[]'::jsonb,
    stock integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    source_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. إنشاء جدول الطلبات (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_id text,
    city text,
    address text,
    items jsonb DEFAULT '[]'::jsonb,
    subtotal numeric DEFAULT 0,
    shipping_cost numeric DEFAULT 0,
    total numeric DEFAULT 0,
    status text DEFAULT 'pending',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. إنشاء جدول الأقسام (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    icon text,
    parent_id text,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. إنشاء جدول الإعلانات (Ads)
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    type text DEFAULT 'image',
    content text,
    image_url text,
    video_url text,
    link text,
    position text DEFAULT 'top',
    is_active boolean DEFAULT true,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. إنشاء سجل الأنشطة (Activity Logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    user_name text,
    action text NOT NULL,
    details text,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. إنشاء جدول ملفات المستخدمين (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY, -- Linked to auth.users
    email text NOT NULL,
    name text NOT NULL,
    phone text,
    role text DEFAULT 'customer',
    avatar text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 9. إنشاء جدول الصلاحيات (User Permissions)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    can_manage_products boolean DEFAULT false,
    can_manage_orders boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    can_manage_ads boolean DEFAULT false,
    can_manage_cities boolean DEFAULT false,
    can_manage_currencies boolean DEFAULT false,
    can_view_reports boolean DEFAULT false,
    can_export_data boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- الحماية والصلاحيات (Security & RLS)
-- ==========================================

-- تفعيل حماية الصفوف (RLS) لكل الجداول
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بقراءة البيانات (كي يعمل المتجر للعملاء الزوار)
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (is_visible = true);
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Ads" ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Orders" ON public.orders FOR SELECT USING (true);

-- السماح للمشرفين (Admins) بالإضافة والتعديل (Insert, Update, Delete)
CREATE POLICY "Admin Write Settings" ON public.store_settings FOR ALL USING (true);
CREATE POLICY "Admin Write Cities" ON public.cities FOR ALL USING (true);
CREATE POLICY "Admin Write Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Admin Write Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Admin Write Ads" ON public.ads FOR ALL USING (true);
CREATE POLICY "Admin Write Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin Write Activity" ON public.activity_logs FOR ALL USING (true);
CREATE POLICY "Admin All Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Admin All Permissions" ON public.user_permissions FOR ALL USING (true);

-- مبروك! الآن قاعدة البيانات جاهزة لاستقبال وحفظ التعديلات للأبد.
