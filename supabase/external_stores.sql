-- ============================================
-- EXTERNAL STORES TABLE FOR API IMPORT
-- ============================================

CREATE TABLE IF NOT EXISTS public.external_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    username TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.external_stores ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Admins can manage external stores"
    ON external_stores FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Viewers can view external stores"
    ON external_stores FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_external_stores_updated_at
    BEFORE UPDATE ON external_stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
