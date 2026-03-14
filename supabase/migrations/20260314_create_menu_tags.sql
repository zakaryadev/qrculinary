-- Create menu_tags table
CREATE TABLE IF NOT EXISTS public.menu_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_ru TEXT NOT NULL,
    name_uz TEXT,
    name_en TEXT,
    icon TEXT, -- Lucide icon name
    color TEXT, -- Hex color
    bg_color TEXT, -- Background color (rgba or hex)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.menu_tags ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access for tags" ON public.menu_tags
    FOR SELECT USING (true);

-- Insert default tags
INSERT INTO public.menu_tags (slug, name_ru, name_uz, name_en, icon, color, bg_color)
VALUES 
    ('hit', 'Хит', 'Hit', 'Hit', 'TrendingUp', '#F97316', 'rgba(249,115,22,0.08)'),
    ('vegan', 'Веган', 'Vegan', 'Vegan', 'Leaf', '#22C55E', 'rgba(34,197,94,0.08)'),
    ('vegetarian', 'Вегетарианское', 'Vegetarian', 'Vegetarian', 'Leaf', '#10B981', 'rgba(16,185,129,0.08)'),
    ('spicy', 'Острое', 'Spicy', 'Spicy', 'Flame', '#EF4444', 'rgba(239,68,68,0.08)'),
    ('new', 'Новинка', 'Yangi', 'New', 'Sparkles', '#8B5CF6', 'rgba(139,92,246,0.08)'),
    ('gluten_free', 'Без глютена', 'Glutensiz', 'Gluten Free', 'WheatOff', '#EAB308', 'rgba(234,179,8,0.08)')
ON CONFLICT (slug) DO UPDATE SET
    name_ru = EXCLUDED.name_ru,
    name_uz = EXCLUDED.name_uz,
    name_en = EXCLUDED.name_en,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    bg_color = EXCLUDED.bg_color;
