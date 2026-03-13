-- supabase/migrations/005_tenant_profile.sql

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS working_hours  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_links   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cuisine_type   TEXT,
  ADD COLUMN IF NOT EXISTS avg_check      INT,
  ADD COLUMN IF NOT EXISTS has_wifi       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_delivery   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_takeaway   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone       TEXT DEFAULT 'Asia/Tashkent',
  ADD COLUMN IF NOT EXISTS theme          TEXT DEFAULT 'dark'
    CHECK (theme IN ('dark', 'light'));

CREATE TABLE IF NOT EXISTS tenant_gallery (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  photo_url  TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tenant_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_public_read" ON tenant_gallery
  FOR SELECT USING (true);

CREATE POLICY "gallery_tenant_write" ON tenant_gallery
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
