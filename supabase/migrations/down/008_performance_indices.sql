-- Rollback 008_performance_indices.sql

DROP INDEX IF EXISTS idx_categories_tenant_id;
DROP INDEX IF EXISTS idx_categories_is_visible;
DROP INDEX IF EXISTS idx_categories_sort_order;
DROP INDEX IF EXISTS idx_menu_items_tenant_id;
DROP INDEX IF EXISTS idx_menu_items_category_id;
DROP INDEX IF EXISTS idx_menu_items_is_available;
DROP INDEX IF EXISTS idx_menu_items_is_hidden;
DROP INDEX IF EXISTS idx_menu_items_sort_order;
DROP INDEX IF EXISTS idx_menu_items_promo_ends_at;
DROP INDEX IF EXISTS idx_qr_codes_tenant_id;
DROP INDEX IF EXISTS idx_qr_codes_branch_id;
DROP INDEX IF EXISTS idx_orders_tenant_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_reviews_tenant_id;
DROP INDEX IF EXISTS idx_reviews_is_visible;
DROP INDEX IF EXISTS idx_analytics_events_tenant_id;
DROP INDEX IF EXISTS idx_analytics_events_event_type;
DROP INDEX IF EXISTS idx_analytics_events_created_at;
DROP INDEX IF EXISTS idx_tenant_gallery_tenant_id;
DROP INDEX IF EXISTS idx_branches_tenant_id;
