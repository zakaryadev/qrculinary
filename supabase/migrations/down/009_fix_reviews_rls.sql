-- Rollback 009_fix_reviews_rls.sql

DROP POLICY IF EXISTS "reviews_tenant_select" ON reviews;
