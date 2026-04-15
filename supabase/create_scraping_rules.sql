-- Create the scraping rules table
CREATE TABLE IF NOT EXISTS store_scraping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain TEXT NOT NULL UNIQUE,
    name_selector TEXT,
    price_selector TEXT,
    image_selector TEXT,
    description_selector TEXT,
    sizes_selector TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_scraping_rules ENABLE ROW LEVEL SECURITY;

-- Create policies map (allow read/write for admins)
DROP POLICY IF EXISTS "Allow admins full access to scraping rules" ON store_scraping_rules;

CREATE POLICY "Allow admins full access to scraping rules" ON store_scraping_rules
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Insert a default example rule
INSERT INTO store_scraping_rules (domain, name_selector, price_selector, image_selector, description_selector, sizes_selector)
VALUES (
    'examplestore.com',
    'h1.product-title',
    '.price-current',
    'img.main-image',
    'div.product-description',
    'button.size-variant'
) ON CONFLICT (domain) DO NOTHING;
