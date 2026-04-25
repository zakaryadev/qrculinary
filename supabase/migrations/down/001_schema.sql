-- Rollback 001_schema.sql

DROP TABLE IF EXISTS tenant_members;
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS tenants;

DELETE FROM storage.buckets WHERE id IN ('menu-photos', 'logos', 'banners', 'qr-exports');

DROP PUBLICATION IF EXISTS supabase_realtime;
