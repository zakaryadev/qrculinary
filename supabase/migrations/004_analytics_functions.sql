-- Migration 004: Analytics functions

-- ===========================================================
-- 1. get_qr_scans_stats
-- Возвращает статистику сканирований по дням за период
-- ===========================================================
CREATE OR REPLACE FUNCTION get_qr_scans_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  scan_date DATE,
  total_scans BIGINT,
  unique_scans BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as scan_date,
    COUNT(*) as total_scans,
    COUNT(DISTINCT meta->>'user_id') as unique_scans -- Предполагаем, что в meta есть идентификатор сессии или юзера
  FROM 
    analytics_events
  WHERE 
    tenant_id = p_tenant_id
    AND event_type = 'qr_scan'
    AND created_at >= p_start_date
    AND created_at <= p_end_date
  GROUP BY 
    DATE(created_at)
  ORDER BY 
    scan_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===========================================================
-- 2. get_top_items_stats
-- Возвращает топ блюд по просмотрам и заказам
-- ===========================================================
CREATE OR REPLACE FUNCTION get_top_items_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  views BIGINT,
  orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH item_views AS (
    SELECT 
      ae.item_id,
      COUNT(*) as views
    FROM analytics_events ae
    WHERE 
      ae.tenant_id = p_tenant_id
      AND ae.event_type = 'item_view'
      AND ae.created_at >= p_start_date
      AND ae.created_at <= p_end_date
    GROUP BY ae.item_id
  ),
  item_orders AS (
    SELECT 
      oi.menu_item_id as item_id,
      SUM(oi.quantity) as orders
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE 
      o.tenant_id = p_tenant_id
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date
      AND o.status != 'cancelled'
    GROUP BY oi.menu_item_id
  )
  SELECT 
    m.id as item_id,
    m.name as item_name,
    COALESCE(iv.views, 0) as views,
    COALESCE(io.orders, 0) as orders
  FROM 
    menu_items m
  LEFT JOIN 
    item_views iv ON m.id = iv.item_id
  LEFT JOIN 
    item_orders io ON m.id = io.item_id
  WHERE 
    m.tenant_id = p_tenant_id
    AND (COALESCE(iv.views, 0) > 0 OR COALESCE(io.orders, 0) > 0)
  ORDER BY 
    orders DESC, views DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ===========================================================
-- 3. get_conversion_stats
-- Возвращает воронку просмотра меню -> корзина (не трекается точно, берем заказы) -> оплачено
-- ===========================================================
CREATE OR REPLACE FUNCTION get_conversion_stats(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  menu_views BIGINT,
  total_orders BIGINT,
  conversion_rate NUMERIC
) AS $$
DECLARE
  v_menu_views BIGINT;
  v_total_orders BIGINT;
BEGIN
  -- Считаем просмотры меню
  SELECT COUNT(*)
  INTO v_menu_views
  FROM analytics_events
  WHERE tenant_id = p_tenant_id
    AND event_type = 'menu_view'
    AND created_at >= p_start_date
    AND created_at <= p_end_date;

  -- Считаем количество успешных заказов
  SELECT COUNT(*)
  INTO v_total_orders
  FROM orders
  WHERE tenant_id = p_tenant_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND status != 'cancelled';

  RETURN QUERY
  SELECT 
    v_menu_views,
    v_total_orders,
    CASE 
      WHEN v_menu_views = 0 THEN 0.0
      ELSE ROUND((v_total_orders::NUMERIC / v_menu_views::NUMERIC) * 100, 2)
    END as conversion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
