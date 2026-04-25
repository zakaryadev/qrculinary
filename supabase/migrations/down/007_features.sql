-- Rollback 007_features.sql

DROP POLICY IF EXISTS "branches_public_read" ON branches;
DROP POLICY IF EXISTS "branches_tenant_write" ON branches;
DROP TABLE IF EXISTS branches;

DROP POLICY IF EXISTS "promo_banners_public_read" ON promo_banners;
DROP POLICY IF EXISTS "promo_banners_tenant_write" ON promo_banners;
DROP TABLE IF EXISTS promo_banners;

ALTER TABLE qr_codes DROP COLUMN IF EXISTS branch_id;

ALTER TABLE menu_items
  DROP COLUMN IF EXISTS is_promo,
  DROP COLUMN IF EXISTS promo_label,
  DROP COLUMN IF EXISTS old_price,
  DROP COLUMN IF EXISTS promo_ends_at,
  DROP COLUMN IF EXISTS name_ru,
  DROP COLUMN IF EXISTS name_uz,
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS description_ru,
  DROP COLUMN IF EXISTS description_uz,
  DROP COLUMN IF EXISTS description_en;

ALTER TABLE categories
  DROP COLUMN IF EXISTS name_ru,
  DROP COLUMN IF EXISTS name_uz;

ALTER TABLE tenants
  DROP COLUMN IF EXISTS description_uz,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS call_center_phone,
  DROP COLUMN IF EXISTS show_call_button;
