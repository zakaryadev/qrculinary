-- Rollback 20260314_create_menu_tags.sql

DROP POLICY IF EXISTS "Allow public read access for tags" ON public.menu_tags;
DROP TABLE IF EXISTS public.menu_tags;
