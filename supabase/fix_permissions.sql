-- ============================================
-- Fix User Permissions Table
-- ============================================
-- Run this script if user_permissions table is missing
-- This is a safe script that checks if table exists first

-- Check if table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_permissions') THEN
        -- Create user permissions table
        CREATE TABLE public.user_permissions (
            user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
            can_manage_products BOOLEAN DEFAULT false,
            can_manage_orders BOOLEAN DEFAULT false,
            can_manage_users BOOLEAN DEFAULT false,
            can_manage_ads BOOLEAN DEFAULT false,
            can_manage_cities BOOLEAN DEFAULT false,
            can_manage_currencies BOOLEAN DEFAULT false,
            can_view_reports BOOLEAN DEFAULT false,
            can_export_data BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index
        CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

        -- Enable RLS
        ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own permissions"
            ON user_permissions FOR SELECT USING (user_id = auth.uid());

        CREATE POLICY "Admins can view all permissions"
            ON user_permissions FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );

        CREATE POLICY "Admins can manage all permissions"
            ON user_permissions FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'admin'
                )
            );

        -- Create trigger for updated_at
        CREATE TRIGGER update_user_permissions_updated_at
            BEFORE UPDATE ON user_permissions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'user_permissions table created successfully';
    ELSE
        RAISE NOTICE 'user_permissions table already exists';
    END IF;
END $$;

-- Grant default permissions to existing editors
INSERT INTO user_permissions (user_id, can_manage_products, can_manage_orders, can_manage_ads)
SELECT id, true, true, true
FROM profiles
WHERE role = 'editor'
ON CONFLICT (user_id) DO NOTHING;

-- Grant view permissions to existing viewers
INSERT INTO user_permissions (user_id, can_view_reports)
SELECT id, true
FROM profiles
WHERE role = 'viewer'
ON CONFLICT (user_id) DO NOTHING;
