-- Rollback 006_storage_buckets.sql

DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_write" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_tenant_delete" ON storage.objects;

DROP POLICY IF EXISTS "tenant_gallery_public_select" ON tenant_gallery;
DROP POLICY IF EXISTS "tenant_gallery_manage" ON tenant_gallery;

DELETE FROM storage.buckets WHERE id = 'gallery';
