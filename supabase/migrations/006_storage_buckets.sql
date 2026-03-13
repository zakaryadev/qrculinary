-- QRCulinary — Migration 006: Storage Buckets Setup
-- Creates buckets for gallery, menu photos, logos and banners
-- plus updates storage policies to include the gallery bucket.

-- ─── Create buckets (idempotent) ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('menu-photos', 'menu-photos', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery',     'gallery',     true,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('logos',       'logos',       true,  2097152,  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('banners',     'banners',     true,  5242880,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public              = EXCLUDED.public,
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- ─── Drop old storage policies (if they exist) ─────────────────────────────

DROP POLICY IF EXISTS "storage_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_write"   ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_update"  ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_delete"  ON storage.objects;

-- ─── Recreate policies covering all buckets ────────────────────────────────

-- Public read for all asset buckets
CREATE POLICY "storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('menu-photos', 'gallery', 'logos', 'banners'));

-- Authenticated users can upload
CREATE POLICY "storage_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('menu-photos', 'gallery', 'logos', 'banners')
  );

-- Owners can replace their files (path starts with their tenant UUID)
CREATE POLICY "storage_tenant_update" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND bucket_id IN ('menu-photos', 'gallery', 'logos', 'banners')
  );

-- Owners can delete their files
CREATE POLICY "storage_tenant_delete" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND bucket_id IN ('menu-photos', 'gallery', 'logos', 'banners')
  );

-- ─── Tenant Gallery RLS (if not already done) ─────────────────────────────

ALTER TABLE tenant_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery photos (for public menu page)
DROP POLICY IF EXISTS "tenant_gallery_public_select" ON tenant_gallery;
CREATE POLICY "tenant_gallery_public_select" ON tenant_gallery
  FOR SELECT USING (true);

-- Only authenticated tenant owners/members can manage
DROP POLICY IF EXISTS "tenant_gallery_manage" ON tenant_gallery;
CREATE POLICY "tenant_gallery_manage" ON tenant_gallery
  FOR ALL USING (is_tenant_member(tenant_id, 'editor'));
