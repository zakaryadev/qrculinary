# QRCulinary — ТЗ: Акции, Филиалы, Мультиязычность, Колл-центр, QR
**Версия 1.0 · Март 2026**

---

## Содержание

1. [Акции и спецпредложения](#1-акции-и-спецпредложения)
2. [Филиалы (мультилокация)](#2-филиалы-мультилокация)
3. [Мультиязычность](#3-мультиязычность)
4. [Колл-центр и контакты](#4-колл-центр-и-контакты)
5. [QR-коды — расширение](#5-qr-коды--расширение)
6. [Миграции БД](#6-миграции-бд)
7. [Приоритеты и сроки](#7-приоритеты-и-сроки)

---

## 1. Акции и спецпредложения

### Что это
Временные предложения типа «2+1», скидки, сезонные сеты.
У Oqtepa Lavash это самый первый раздел в меню — гости смотрят его первым.

### Как выглядит на публичной странице
```
┌─────────────────────────────────────────────────┐
│  🔖 АКЦИИ                          до 31 марта  │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  Маргарита 2+1                    │
│  │  фото    │  Купи 2 — получи 3-ю бесплатно   │
│  └──────────┘  ~~59 000~~ → 39 000 сум  [хит]  │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  Рамазан Комбо                    │
│  │  фото    │  Лаваш + напиток + снек           │
│  └──────────┘  49 000 сум            [новинка]  │
└─────────────────────────────────────────────────┘
```

### Изменения в `menu_items`
```sql
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_promo        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_label     TEXT,       -- '2+1', 'Рамазан', 'OQFEST'
  ADD COLUMN IF NOT EXISTS old_price       NUMERIC(10,2), -- цена до скидки (для зачёркивания)
  ADD COLUMN IF NOT EXISTS promo_ends_at   TIMESTAMPTZ;   -- когда акция заканчивается
```

### Новая таблица `promo_banners`
Для больших баннеров акций в шапке меню.
```sql
CREATE TABLE promo_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  image_url   TEXT,
  link_url    TEXT,           -- куда ведёт клик (категория или блюдо)
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Автоматическое скрытие просроченных акций
```typescript
// utils/promo.ts
export function isPromoActive(item: MenuItem): boolean {
  if (!item.is_promo) return false
  if (!item.promo_ends_at) return true
  return new Date(item.promo_ends_at) > new Date()
}

// В запросе добавляем фильтр:
// .or('promo_ends_at.is.null,promo_ends_at.gt.now()')
```

### Как выглядит в дашборде
```
Меню → [+ Добавить блюдо]
         ↓
    Форма блюда:
    ...
    [ ] Это акция / спецпредложение
        ├── Ярлык акции: [2+1 ▾] или [своё: ______]
        ├── Старая цена: [59 000] сум  (зачёркивается)
        └── Акция до: [31.03.2026 ▾]  (опционально)
```

### Storage
| Бакет | Путь | Макс. размер |
|-------|------|-------------|
| `promo-banners` | `/{tenant_id}/{banner_id}.webp` | 400 KB |

---

## 2. Филиалы (мультилокация)

### Концепция
Один бренд — несколько точек. Например: «Bamburger» имеет 3 адреса в городе.

**Архитектурное решение:**
Вводим понятие **Brand** (бренд) и **Branch** (филиал).
- Brand = общие настройки: название, логотип, цвета, меню
- Branch = конкретная точка: адрес, телефон, часы работы, QR-коды

```
Brand: Bamburger
├── Branch: Чиланзар (ул. Достлик 5)
├── Branch: Юнусабад (пр. Амира Темура 12)
└── Branch: Мирзо-Улугбек (ул. Фаробий 3)
```

### Изменения в БД

```sql
-- Переименовываем tenants в brands концептуально,
-- добавляем таблицу branches

CREATE TABLE branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,          -- 'Филиал Чиланзар'
  slug          TEXT UNIQUE NOT NULL,   -- /menu/bamburger-chilanzer
  address       TEXT NOT NULL,
  phone         TEXT,
  lat           DECIMAL(10, 8),         -- координаты для карты
  lng           DECIMAL(11, 8),
  working_hours JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- QR-коды привязываем к филиалу, не к бренду
ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
```

### URL-структура

| URL | Что показывает |
|-----|---------------|
| `/menu/bamburger` | Список всех филиалов бренда + выбор |
| `/menu/bamburger/chilanzer` | Меню конкретного филиала |
| `/menu/bamburger/yunusabad` | Меню другого филиала |

### Страница выбора филиала
```
┌─────────────────────────────────────────────────┐
│   🍔 Bamburger                                   │
│   Выберите ближайший филиал                     │
├─────────────────────────────────────────────────┤
│  📍 Чиланзар · ул. Достлик 5                    │
│  🟢 Открыто · до 23:00        [Открыть меню →]  │
├─────────────────────────────────────────────────┤
│  📍 Юнусабад · пр. Амира Темура 12              │
│  🟢 Открыто · до 00:00        [Открыть меню →]  │
├─────────────────────────────────────────────────┤
│  📍 Мирзо-Улугбек · ул. Фаробий 3              │
│  🔴 Закрыто · откроется в 10:00                 │
└─────────────────────────────────────────────────┘
```

### Лимиты по тарифам

| Тариф | Макс. филиалов |
|-------|---------------|
| Free | 1 |
| Pro | 3 |
| Business | 10 |
| Enterprise | Без лимита |

### В дашборде
```
/dashboard/branches           — список всех филиалов
/dashboard/branches/new       — добавить филиал
/dashboard/branches/[id]      — редактировать адрес, часы, телефон
/dashboard/branches/[id]/qr   — QR-коды конкретного филиала
```

### Меню — общее или разное?
На старте — **одно меню на весь бренд**. Цены и блюда одинаковые везде.
В будущем (P2) — возможность переопределить цену в конкретном филиале.

---

## 3. Мультиязычность

### Поддерживаемые языки на старте
- 🇷🇺 Русский (по умолчанию)
- 🇺🇿 Узбекский (латиница)
- 🇬🇧 Английский

### Как работает

**Для гостя:** кнопка переключения языка в шапке меню.
Выбор сохраняется в `localStorage`. При следующем визите — запоминается.

```
┌──────────────────────────────┐
│  Bamburger          [RU ▾]   │  ← переключатель
│                     ├ RU     │
│                     ├ UZ     │
│                     └ EN     │
└──────────────────────────────┘
```

### Изменения в БД

**Подход: отдельные колонки (проще на старте)**
```sql
-- menu_items уже имеет name_en, добавляем узбекский:
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS name_uz        TEXT,
  ADD COLUMN IF NOT EXISTS description_uz TEXT,
  ADD COLUMN IF NOT EXISTS name_ru        TEXT,  -- явно, не полагаемся на name
  ADD COLUMN IF NOT EXISTS description_ru TEXT;

-- categories:
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_uz TEXT,
  ADD COLUMN IF NOT EXISTS name_ru TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

-- tenants (описание заведения):
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS description_uz TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;
```

### Хелпер для получения нужного перевода

```typescript
// utils/i18n.ts
type Lang = 'ru' | 'uz' | 'en'

export function t(
  item: { name?: string; name_ru?: string; name_uz?: string; name_en?: string },
  lang: Lang,
  field: 'name' | 'description' = 'name'
): string {
  const key = field === 'name'
    ? { ru: 'name_ru', uz: 'name_uz', en: 'name_en' }
    : { ru: 'description_ru', uz: 'description_uz', en: 'description_en' }

  return (item as any)[key[lang]]
    || (item as any)[key['ru']]   // fallback на русский
    || (item as any)['name']      // финальный fallback
    || ''
}

// Использование:
// t(menuItem, 'uz') → вернёт name_uz, или name_ru если нет, или name
```

### В дашборде — форма редактирования блюда

```
Название блюда:
  [RU] Большой лаваш        ← основное, обязательно
  [UZ] Katta lavash          ← опционально
  [EN] Big lavash            ← опционально

Описание:
  [RU] Классический лаваш с говядиной...
  [UZ] Klassik mol go'shti bilan lavash...
  [EN] Classic lavash with beef...
```

Поля UZ и EN сворачиваются по умолчанию. Раскрываются кликом «+ Добавить перевод».

### URL с языком

```
/menu/bamburger         → автодетект (из браузера или localStorage)
/menu/bamburger?lang=uz → принудительно узбекский
/menu/bamburger?lang=en → принудительно английский
```

### Переключение языка интерфейса (Next.js i18n)

```typescript
// next.config.ts
const nextConfig = {
  i18n: {
    locales: ['ru', 'uz', 'en'],
    defaultLocale: 'ru',
    localeDetection: false, // не менять URL автоматически
  },
}
```

---

## 4. Колл-центр и контакты

### Что это
Единый номер телефона бренда, prominently показанный везде.
У Oqtepa Lavash это `(78) 150 00 30` — видно на каждой странице.

### Где показывать

**1. Шапка публичного меню (всегда видно)**
```
┌─────────────────────────────────────────┐
│  Bamburger              📞 78 150 00 30 │
│  ⭐ 4.9 · Чиланзар                      │
└─────────────────────────────────────────┘
```

**2. Футер каждой страницы**
```
┌─────────────────────────────────────────┐
│  🍔 Bamburger                           │
│                                         │
│  📞 Колл-центр: 78 150 00 30           │
│  📸 Instagram  ✈️ Telegram  🗺 2GIS    │
│                                         │
│  © 2026 Bamburger · Работает на        │
│  QRCulinary                            │
└─────────────────────────────────────────┘
```

**3. Плавающая кнопка звонка на мобиле**
```
                              ┌────┐
                              │ 📞 │  ← fixed bottom-right
                              └────┘
```
При нажатии — `tel:` ссылка, звонок напрямую.

### Изменения в БД
```sql
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS call_center_phone TEXT,  -- главный номер
  ADD COLUMN IF NOT EXISTS show_call_button  BOOLEAN DEFAULT true;
```

### Форматирование номера
```typescript
// utils/phone.ts
export function formatPhone(phone: string): string {
  // '+998781500030' → '78 150 00 30'
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('998')) {
    const local = clean.slice(3)
    return `${local.slice(0,2)} ${local.slice(2,5)} ${local.slice(5,7)} ${local.slice(7)}`
  }
  return phone
}

export function phoneLink(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  return `tel:+${clean.startsWith('998') ? clean : '998' + clean}`
}
```

### Компонент
```tsx
// components/ui/CallButton.tsx
import { Phone } from '@/lib/icons'

export function CallButton({ phone }: { phone: string }) {
  return (
    <a
      href={phoneLink(phone)}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center
                 w-14 h-14 rounded-full shadow-lg bg-green-500 text-white
                 hover:bg-green-600 transition-colors md:hidden"
      aria-label="Позвонить"
    >
      <Phone size={24} />
    </a>
  )
}
```

На десктопе — не показывать (`md:hidden`), там и так видно в шапке.

---

## 5. QR-коды — расширение

### 5.1 QR на каждый филиал

Каждый филиал получает собственный набор QR-кодов:
- Главный QR филиала → `/menu/bamburger/chilanzer`
- QR по столам → `/menu/bamburger/chilanzer?table=5`

```sql
-- Уже добавили branch_id в qr_codes в разделе 2
-- URL генерируется автоматически из slug бренда + slug филиала
```

### 5.2 QR-карточка для печати

Генерируем красивую карточку для стола в нескольких форматах.

**Форматы:**
| Формат | Размер | Использование |
|--------|--------|---------------|
| Визитка | 85×55 мм | Маленькая карточка на стол |
| Тент-карта | 100×210 мм | Складная карточка-шатёр |
| A5 | 148×210 мм | Ламинированный лист |
| A4 | 210×297 мм | Страница с 4 карточками для вырезки |

**Содержимое карточки:**
```
┌────────────────────────┐
│   🍔  Bamburger        │
│                        │
│   ┌──────────────┐     │
│   │              │     │
│   │   QR КОД     │     │
│   │              │     │
│   └──────────────┘     │
│                        │
│   Стол №5              │
│   Сканируйте для       │
│   просмотра меню       │
│   и заказа             │
│                        │
│   qrculinary.com/...   │
└────────────────────────┘
```

**Генерация PDF:**
```typescript
// lib/qr/generateCard.ts
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

export async function generateQRCard(options: {
  url: string
  tenantName: string
  tableNumber?: string
  primaryColor: string
  logoUrl?: string
  format: 'business-card' | 'tent' | 'a5' | 'a4'
}): Promise<Blob> {
  const qrDataUrl = await QRCode.toDataURL(options.url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })

  const doc = new jsPDF({ /* размер по format */ })
  // ... рисуем карточку
  return doc.output('blob')
}
```

### 5.3 QR со встроенным логотипом

Логотип заведения в центре QR-кода — повышает узнаваемость бренда.

```typescript
// lib/qr/generateWithLogo.ts
export async function generateQRWithLogo(url: string, logoUrl: string): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, { width: 400, margin: 2 })

  const ctx = canvas.getContext('2d')!
  const logo = new Image()
  logo.src = logoUrl

  await new Promise(resolve => { logo.onload = resolve })

  // Логотип в центре — 20% от размера QR
  const logoSize = canvas.width * 0.2
  const x = (canvas.width - logoSize) / 2
  const y = (canvas.height - logoSize) / 2

  // Белый фон под логотипом
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 8)
  ctx.fill()

  ctx.drawImage(logo, x, y, logoSize, logoSize)

  return canvas.toDataURL('image/png')
}
```

### 5.4 Аналитика QR

Расширяем что именно пишем при сканировании:

```sql
-- В analytics_events при event_type='qr_scan' пишем в meta:
-- {
--   "table_number": "5",
--   "branch_id": "uuid",
--   "branch_name": "Чиланзар",
--   "user_agent": "iPhone/Safari",
--   "lang": "uz"
-- }
```

**В дашборде аналитики добавляем:**
- Топ-активных столов (какой стол сканируют чаще)
- Сравнение филиалов по сканированиям
- Какой язык выбирают гости

### 5.5 QR с UTM-метками

Для отслеживания источников трафика:
```
/menu/bamburger/chilanzer?table=5&utm_source=qr&utm_medium=table&utm_campaign=chilanzer
```

---

## 6. Миграции БД

Все изменения в одном файле:

```sql
-- supabase/migrations/003_features.sql

-- 1. Акции
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_promo      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_label   TEXT,
  ADD COLUMN IF NOT EXISTS old_price     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS promo_banners (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  image_url   TEXT,
  link_url    TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Филиалы
CREATE TABLE IF NOT EXISTS branches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  address       TEXT NOT NULL,
  phone         TEXT,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  working_hours JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- RLS для филиалов
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_public_read" ON branches
  FOR SELECT USING (is_active = true);

CREATE POLICY "branches_tenant_write" ON branches
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- 3. Мультиязычность
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS name_ru        TEXT,
  ADD COLUMN IF NOT EXISTS name_uz        TEXT,
  ADD COLUMN IF NOT EXISTS name_en        TEXT,
  ADD COLUMN IF NOT EXISTS description_ru TEXT,
  ADD COLUMN IF NOT EXISTS description_uz TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_ru TEXT,
  ADD COLUMN IF NOT EXISTS name_uz TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS description_uz    TEXT,
  ADD COLUMN IF NOT EXISTS description_en    TEXT;

-- 4. Колл-центр
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS call_center_phone TEXT,
  ADD COLUMN IF NOT EXISTS show_call_button  BOOLEAN DEFAULT true;

-- Мигрируем существующие name → name_ru
UPDATE menu_items SET name_ru = name WHERE name_ru IS NULL;
UPDATE categories SET name_ru = name WHERE name_ru IS NULL;
```

---

## 7. Приоритеты и сроки

| Фича | Приоритет | Сложность | Оценка |
|------|-----------|-----------|--------|
| Колл-центр (кнопка + футер) | P0 | Низкая | 2–3 часа |
| Акции — флаг `is_promo` + старая цена | P0 | Низкая | 3–4 часа |
| Мультиязычность — колонки + переключатель | P1 | Средняя | 1–2 дня |
| QR-карточка для печати (PDF) | P1 | Средняя | 1 день |
| QR с логотипом | P1 | Низкая | 3–4 часа |
| Филиалы — таблица + страница выбора | P1 | Высокая | 2–3 дня |
| Баннеры акций | P2 | Средняя | 1 день |
| Аналитика QR по столам и филиалам | P2 | Средняя | 1 день |
| QR с UTM-метками | P2 | Низкая | 1–2 часа |

**Рекомендуемый порядок:**
1. Колл-центр — быстро, сразу виден результат
2. Акции (`is_promo`) — 1 день, большой визуальный эффект
3. Мультиязычность — важно для Узбекистана (RU + UZ)
4. QR улучшения — карточка + логотип
5. Филиалы — самое сложное, делаем последним

**Итого: ~1–1.5 недели работы**

---

## Структура новых страниц

```
app/
├── menu/
│   └── [slug]/
│       ├── page.tsx              ← если 1 филиал — сразу меню
│       │                           если несколько — список филиалов
│       └── [branch]/
│           └── page.tsx          ← меню конкретного филиала
│
dashboard/
├── branches/
│   ├── page.tsx                  ← список филиалов
│   ├── new/page.tsx              ← добавить филиал
│   └── [id]/
│       ├── page.tsx              ← редактировать
│       └── qr/page.tsx           ← QR этого филиала
├── promotions/
│   ├── page.tsx                  ← список акций
│   └── new/page.tsx              ← добавить акцию/баннер
```

---

*QRCulinary · ТЗ Новые фичи v1.0 · Март 2026*