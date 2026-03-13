-- QRCulinary — Database Schema
-- Migration 001: Core Tables

-- ===========================================================
-- 2.1 tenants — Заведения
-- ===========================================================
CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  logo_url       TEXT,
  banner_url     TEXT,
  primary_color  TEXT DEFAULT '#3ECF8E',
  accent_color   TEXT DEFAULT '#1C1C1C',
  address        TEXT,
  phone          TEXT,
  instagram      TEXT,
  is_active      BOOLEAN DEFAULT true,
  plan           TEXT DEFAULT 'free',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.2 categories — Категории меню
-- ===========================================================
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  name_en    TEXT,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.3 menu_items — Блюда
-- ===========================================================
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  name_en      TEXT,
  description  TEXT,
  base_price   NUMERIC(10,2) NOT NULL,
  photo_url    TEXT,
  weight       TEXT,
  calories     INT,
  is_available BOOLEAN DEFAULT true,
  is_hidden    BOOLEAN DEFAULT false,
  sort_order   INT DEFAULT 0,
  tags         TEXT[] DEFAULT '{}',
  options      JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.4 qr_codes — QR-коды
-- ===========================================================
CREATE TABLE qr_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  table_number TEXT,
  url          TEXT NOT NULL,
  scan_count   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.5 orders + order_items — Заказы
-- ===========================================================
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  qr_code_id   UUID REFERENCES qr_codes(id),
  table_number TEXT,
  status       TEXT DEFAULT 'new',
  total        NUMERIC(10,2) NOT NULL,
  guest_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id     UUID REFERENCES menu_items(id),
  name             TEXT NOT NULL,
  price            NUMERIC(10,2) NOT NULL,
  quantity         INT DEFAULT 1,
  selected_options JSONB DEFAULT '{}'
);

-- ===========================================================
-- 2.6 reviews — Отзывы
-- ===========================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  author_name TEXT DEFAULT 'Гость',
  is_visible  BOOLEAN DEFAULT true,
  reply       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.7 analytics_events — Аналитика
-- ===========================================================
CREATE TABLE analytics_events (
  id         BIGSERIAL PRIMARY KEY,
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  qr_code_id UUID,
  item_id    UUID,
  meta       JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================
-- 2.8 tenant_members — Команда заведения
-- ===========================================================
CREATE TABLE tenant_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'editor',
  UNIQUE(tenant_id, user_id)
);

-- ===========================================================
-- Storage Buckets
-- ===========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('menu-photos', 'menu-photos', true),
  ('logos', 'logos', true),
  ('banners', 'banners', true),
  ('qr-exports', 'qr-exports', false)
ON CONFLICT (id) DO NOTHING;
-- ===========================================================
-- Realtime Subscriptions
-- ===========================================================
-- Enable realtime for orders table
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
