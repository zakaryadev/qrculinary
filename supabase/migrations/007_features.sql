-- 1. Акции
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_promo      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_label   TEXT,
  ADD COLUMN IF NOT EXISTS old_price     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS promo_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  image_url   TEXT,
  link_url    TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS для promo_banners
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo_banners_public_read" ON promo_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "promo_banners_tenant_write" ON promo_banners
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- 2. Филиалы
CREATE TABLE IF NOT EXISTS branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  address       TEXT NOT NULL,
  phone         TEXT,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  working_hours JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- RLS для филиалов
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_public_read" ON branches
  FOR SELECT USING (is_active = true);

CREATE POLICY "branches_tenant_write" ON branches
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- 3. Мультиязычность
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS name_ru        TEXT,
  ADD COLUMN IF NOT EXISTS name_uz        TEXT,
  ADD COLUMN IF NOT EXISTS name_en        TEXT,
  ADD COLUMN IF NOT EXISTS description_ru TEXT,
  ADD COLUMN IF NOT EXISTS description_uz TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ru TEXT,
  ADD COLUMN IF NOT EXISTS name_uz TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS description_uz    TEXT,
  ADD COLUMN IF NOT EXISTS description_en    TEXT;

-- 4. Колл-центр
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS call_center_phone TEXT,
  ADD COLUMN IF NOT EXISTS show_call_button  BOOLEAN DEFAULT true;

-- Мигрируем существующие name → name_ru
UPDATE menu_items SET name_ru = name WHERE name_ru IS NULL;
UPDATE categories SET name_ru = name WHERE name_ru IS NULL;
