-- Migration 008: Performance Indices
-- This migration adds indices to frequently searched and filtered columns to improve performance.

-- Tenants
-- slug already has a unique index, no need for another.

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_visible ON categories(is_visible);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_hidden ON menu_items(is_hidden);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort_order ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_promo_ends_at ON menu_items(promo_ends_at);

-- QR Codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_tenant_id ON qr_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_branch_id ON qr_codes(branch_id);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_visible ON reviews(is_visible);

-- Analytics Events
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Tenant Gallery
CREATE INDEX IF NOT EXISTS idx_tenant_gallery_tenant_id ON tenant_gallery(tenant_id);

-- Branches
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
