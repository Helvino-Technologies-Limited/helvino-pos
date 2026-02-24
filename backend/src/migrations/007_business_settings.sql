-- Add missing columns to branches if not exist
ALTER TABLE branches ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS website VARCHAR(100);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS county VARCHAR(50);
ALTER TABLE branches ADD COLUMN IF NOT EXISTS town VARCHAR(50);

-- Business settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id           UUID UNIQUE REFERENCES branches(id) ON DELETE CASCADE,
  receipt_header      TEXT,
  receipt_footer      TEXT,
  receipt_show_logo   BOOLEAN DEFAULT true,
  receipt_show_address BOOLEAN DEFAULT true,
  receipt_show_phone  BOOLEAN DEFAULT true,
  receipt_show_email  BOOLEAN DEFAULT false,
  receipt_show_website BOOLEAN DEFAULT false,
  receipt_width       INTEGER DEFAULT 80,
  receipt_copies      INTEGER DEFAULT 1,
  currency_symbol     VARCHAR(10) DEFAULT 'KES',
  tax_rate            DECIMAL(5,2) DEFAULT 0,
  tax_name            VARCHAR(20) DEFAULT 'VAT',
  tax_inclusive       BOOLEAN DEFAULT false,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);
