-- Migration 009: Fix Reviews RLS
-- Add SELECT policy for tenant members

CREATE POLICY "reviews_tenant_select" ON reviews
  FOR SELECT USING (is_tenant_member(tenant_id, 'viewer'));
