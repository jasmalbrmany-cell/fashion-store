-- ============================================
-- Migration: User Permissions System
-- شغّل هذا في SQL Editor في Supabase
-- ============================================

-- جدول الصلاحيات المخصصة لكل مستخدم
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    can_manage_products     BOOLEAN DEFAULT false,
    can_manage_orders       BOOLEAN DEFAULT false,
    can_manage_users        BOOLEAN DEFAULT false,
    can_manage_ads          BOOLEAN DEFAULT false,
    can_manage_cities       BOOLEAN DEFAULT false,
    can_manage_currencies   BOOLEAN DEFAULT false,
    can_view_reports        BOOLEAN DEFAULT false,
    can_export_data         BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS للصلاحيات
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;
CREATE POLICY "Admins can manage permissions"
    ON user_permissions FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
CREATE POLICY "Users can view their own permissions"
    ON user_permissions FOR SELECT USING (auth.uid() = user_id);

-- Trigger للتحديث التلقائي
CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- دالة لإنشاء صلاحيات افتراضية للمحررين الجدد
CREATE OR REPLACE FUNCTION create_default_permissions(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_permissions (user_id, can_manage_products, can_manage_orders, can_view_reports)
    VALUES (p_user_id, true, true, true)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحية للأدمن الحالي (داود الهاشدي)
INSERT INTO user_permissions (
    user_id,
    can_manage_products, can_manage_orders, can_manage_users,
    can_manage_ads, can_manage_cities, can_manage_currencies,
    can_view_reports, can_export_data
)
SELECT id, true, true, true, true, true, true, true, true
FROM profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO UPDATE SET
    can_manage_products = true, can_manage_orders = true,
    can_manage_users = true, can_manage_ads = true,
    can_manage_cities = true, can_manage_currencies = true,
    can_view_reports = true, can_export_data = true;

-- تحقق
SELECT p.email, p.role, up.*
FROM profiles p
LEFT JOIN user_permissions up ON p.id = up.user_id
ORDER BY p.role;
