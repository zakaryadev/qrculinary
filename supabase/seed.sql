-- QRCulinary — Seed Data (Test Restaurant)
-- Creates a test user in auth.users then seeds the restaurant data.

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001';
  v_tenant_id UUID;
  v_cat_pizza UUID;
  v_cat_pasta UUID;
  v_cat_drinks UUID;
  v_item_id UUID;
  v_qr_id UUID;
BEGIN

-- Create test user in auth.users (idempotent)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
)
VALUES (
  v_user_id,
  'testowner@qrculinary.local',
  crypt('testpassword123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test Owner"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Tenant
INSERT INTO tenants (owner_id, slug, name, description, address, phone, primary_color)
VALUES (v_user_id, 'mama-roma', 'Mama Roma', 'Лучшая итальянская кухня в городе', 'ул. Навои, 15', '+998901234567', '#E8503A')
RETURNING id INTO v_tenant_id;

-- Categories
INSERT INTO categories (tenant_id, name, sort_order) VALUES (v_tenant_id, 'Пиццы', 1) RETURNING id INTO v_cat_pizza;
INSERT INTO categories (tenant_id, name, sort_order) VALUES (v_tenant_id, 'Паста', 2) RETURNING id INTO v_cat_pasta;
INSERT INTO categories (tenant_id, name, sort_order) VALUES (v_tenant_id, 'Напитки', 3) RETURNING id INTO v_cat_drinks;

-- Menu items — Пиццы
INSERT INTO menu_items (tenant_id, category_id, name, description, base_price, weight, tags, options) VALUES
  (v_tenant_id, v_cat_pizza, 'Маргарита', 'Классическая пицца с томатным соусом и моцареллой', 59000, '400г',
   ARRAY['hit','vegetarian'],
   '{"variants":[{"name":"S","price_delta":0},{"name":"M","price_delta":15000},{"name":"L","price_delta":30000}],"modifiers":[{"name":"Сырный борт","price":10000,"max":1}]}'::jsonb),
  (v_tenant_id, v_cat_pizza, 'Пепперони', 'Пицца с острой колбасой пепперони', 69000, '420г',
   ARRAY['spicy','hit'],
   '{"variants":[{"name":"S","price_delta":0},{"name":"M","price_delta":15000},{"name":"L","price_delta":30000}]}'::jsonb),
  (v_tenant_id, v_cat_pizza, 'Четыре сыра', 'Пицца с четырьмя видами сыра', 79000, '430г',
   ARRAY['vegetarian','new'],
   '{"variants":[{"name":"S","price_delta":0},{"name":"M","price_delta":15000}]}'::jsonb);

-- Menu items — Паста
INSERT INTO menu_items (tenant_id, category_id, name, description, base_price, weight, tags) VALUES
  (v_tenant_id, v_cat_pasta, 'Карбонара', 'Классическая паста с яйцом и беконом', 55000, '350г', ARRAY['hit']),
  (v_tenant_id, v_cat_pasta, 'Болоньезе', 'Паста с мясным соусом', 52000, '380г', ARRAY[]::text[]),
  (v_tenant_id, v_cat_pasta, 'Penne арабьята', 'Острая паста с томатным соусом', 45000, '320г', ARRAY['spicy','vegan']);

-- Menu items — Напитки
INSERT INTO menu_items (tenant_id, category_id, name, description, base_price, weight, tags) VALUES
  (v_tenant_id, v_cat_drinks, 'Кола 0.5', 'Coca-Cola 0.5L', 15000, '500мл', ARRAY[]::text[]),
  (v_tenant_id, v_cat_drinks, 'Лимонад', 'Домашний лимонад', 18000, '400мл', ARRAY['new']),
  (v_tenant_id, v_cat_drinks, 'Вода', 'Минеральная вода', 8000, '500мл', ARRAY[]::text[]);

-- QR Codes
INSERT INTO qr_codes (tenant_id, label, url) VALUES
  (v_tenant_id, 'Главный', 'https://qrculinary.com/menu/mama-roma')
RETURNING id INTO v_qr_id;

INSERT INTO qr_codes (tenant_id, label, table_number, url) VALUES
  (v_tenant_id, 'Стол 1', '1', 'https://qrculinary.com/menu/mama-roma?table=1'),
  (v_tenant_id, 'Стол 2', '2', 'https://qrculinary.com/menu/mama-roma?table=2'),
  (v_tenant_id, 'Стол 3', '3', 'https://qrculinary.com/menu/mama-roma?table=3');

-- Reviews
INSERT INTO reviews (tenant_id, rating, comment, author_name) VALUES
  (v_tenant_id, 5, 'Отличная пицца! Обязательно вернёмся!', 'Алишер'),
  (v_tenant_id, 4, 'Всё вкусно, немного долго ждали.', 'Малика'),
  (v_tenant_id, 5, 'Лучшая карбонара в городе!', 'Дамир');

END $$;
