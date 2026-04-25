-- Rollback 005_tenant_profile.sql

DROP POLICY IF EXISTS "gallery_public_read" ON tenant_gallery;
DROP POLICY IF EXISTS "gallery_tenant_write" ON tenant_gallery;
DROP TABLE IF EXISTS tenant_gallery;

ALTER TABLE tenants
  DROP COLUMN IF EXISTS working_hours,
  DROP COLUMN IF EXISTS social_links,
  DROP COLUMN IF EXISTS cuisine_type,
  DROP COLUMN IF EXISTS avg_check,
  DROP COLUMN IF EXISTS has_wifi,
  DROP COLUMN IF EXISTS has_delivery,
  DROP COLUMN IF EXISTS has_takeaway,
  DROP COLUMN IF EXISTS timezone,
  DROP COLUMN IF EXISTS theme;
