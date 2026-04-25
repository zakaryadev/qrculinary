-- Rollback 002_rls.sql

DROP FUNCTION IF EXISTS is_tenant_member;

DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_own" ON tenants;
DROP POLICY IF EXISTS "tenants_update_own" ON tenants;
DROP POLICY IF EXISTS "tenants_delete_own" ON tenants;
DROP POLICY IF EXISTS "tenants_public_select" ON tenants;

ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_select" ON categories;
DROP POLICY IF EXISTS "categories_manage" ON categories;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "menu_items_public_select" ON menu_items;
DROP POLICY IF EXISTS "menu_items_manage" ON menu_items;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_codes_public_select" ON qr_codes;
DROP POLICY IF EXISTS "qr_codes_manage" ON qr_codes;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_guest_insert" ON orders;
DROP POLICY IF EXISTS "orders_tenant_select" ON orders;
DROP POLICY IF EXISTS "orders_tenant_update" ON orders;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_guest_insert" ON order_items;
DROP POLICY IF EXISTS "order_items_tenant_select" ON order_items;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_select" ON reviews;
DROP POLICY IF EXISTS "reviews_guest_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_tenant_update" ON reviews;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_guest_insert" ON analytics_events;
DROP POLICY IF EXISTS "analytics_tenant_select" ON analytics_events;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_members_manage" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_self_select" ON tenant_members;
ALTER TABLE tenant_members DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_write" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_delete" ON storage.objects;
