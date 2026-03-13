-- QRCulinary — Row Level Security Policies
-- Migration 002: RLS

-- ===========================================================
-- Helper function: check if user owns or is member of tenant
-- ===========================================================
CREATE OR REPLACE FUNCTION is_tenant_member(t_id UUID, min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenants WHERE id = t_id AND owner_id = auth.uid()
    UNION
    SELECT 1 FROM tenant_members
    WHERE tenant_id = t_id AND user_id = auth.uid()
      AND CASE min_role
        WHEN 'viewer' THEN role IN ('viewer','editor','admin')
        WHEN 'editor' THEN role IN ('editor','admin')
        WHEN 'admin'  THEN role = 'admin'
        ELSE false
      END
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ===========================================================
-- TENANTS
-- ===========================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (owner_id = auth.uid() OR is_tenant_member(id));

CREATE POLICY "tenants_insert_own" ON tenants
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "tenants_delete_own" ON tenants
  FOR DELETE USING (owner_id = auth.uid());

-- Public can read active tenants (for /menu/[slug])
CREATE POLICY "tenants_public_select" ON tenants
  FOR SELECT USING (is_active = true);

-- ===========================================================
-- CATEGORIES
-- ===========================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public can read visible categories
CREATE POLICY "categories_public_select" ON categories
  FOR SELECT USING (is_visible = true);

-- Owner/member can manage
CREATE POLICY "categories_manage" ON categories
  FOR ALL USING (is_tenant_member(tenant_id, 'editor'));

-- ===========================================================
-- MENU ITEMS
-- ===========================================================
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public can read available, non-hidden items
CREATE POLICY "menu_items_public_select" ON menu_items
  FOR SELECT USING (is_hidden = false AND is_available = true);

-- Owner/member can manage
CREATE POLICY "menu_items_manage" ON menu_items
  FOR ALL USING (is_tenant_member(tenant_id, 'editor'));

-- ===========================================================
-- QR CODES
-- ===========================================================
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Public can read (to resolve QR scan)
CREATE POLICY "qr_codes_public_select" ON qr_codes
  FOR SELECT USING (true);

-- Owner/member can manage
CREATE POLICY "qr_codes_manage" ON qr_codes
  FOR ALL USING (is_tenant_member(tenant_id, 'editor'));

-- ===========================================================
-- ORDERS
-- ===========================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Guests can insert (without auth)
CREATE POLICY "orders_guest_insert" ON orders
  FOR INSERT WITH CHECK (true);

-- Owner/member can read and update
CREATE POLICY "orders_tenant_select" ON orders
  FOR SELECT USING (is_tenant_member(tenant_id, 'viewer'));

CREATE POLICY "orders_tenant_update" ON orders
  FOR UPDATE USING (is_tenant_member(tenant_id, 'editor'));

-- ===========================================================
-- ORDER ITEMS
-- ===========================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_guest_insert" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_tenant_select" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND is_tenant_member(o.tenant_id, 'viewer')
    )
  );

-- ===========================================================
-- REVIEWS
-- ===========================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read visible reviews
CREATE POLICY "reviews_public_select" ON reviews
  FOR SELECT USING (is_visible = true);

-- Guests can insert
CREATE POLICY "reviews_guest_insert" ON reviews
  FOR INSERT WITH CHECK (true);

-- Owner/member can update (reply, hide)
CREATE POLICY "reviews_tenant_update" ON reviews
  FOR UPDATE USING (is_tenant_member(tenant_id, 'editor'));

-- ===========================================================
-- ANALYTICS EVENTS
-- ===========================================================
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events
CREATE POLICY "analytics_guest_insert" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Only owner/member can read
CREATE POLICY "analytics_tenant_select" ON analytics_events
  FOR SELECT USING (is_tenant_member(tenant_id, 'viewer'));

-- ===========================================================
-- TENANT MEMBERS
-- ===========================================================
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_manage" ON tenant_members
  FOR ALL USING (is_tenant_member(tenant_id, 'admin'));

CREATE POLICY "tenant_members_self_select" ON tenant_members
  FOR SELECT USING (user_id = auth.uid());

-- ===========================================================
-- Storage policies
-- ===========================================================
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('menu-photos','logos','banners'));

CREATE POLICY "storage_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "storage_tenant_update" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_tenant_delete" ON storage.objects
  FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
