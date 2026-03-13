export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── DB Types ────────────────────────────────────────────────────────────────

export interface Tenant {
  id: string
  owner_id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  accent_color: string
  address: string | null
  phone: string | null
  instagram: string | null
  is_active: boolean
  plan: 'free' | 'pro' | 'business'
  working_hours: Json
  social_links: Json
  cuisine_type: string | null
  avg_check: number | null
  has_wifi: boolean
  has_delivery: boolean
  has_takeaway: boolean
  timezone: string
  theme: 'dark' | 'light'
  created_at: string
}

export interface TenantGallery {
  id: string
  tenant_id: string
  photo_url: string
  sort_order: number
  created_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  name_en: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
}

export interface MenuItemOptions {
  variants?: { name: string; price_delta: number }[]
  modifiers?: { name: string; price: number; max: number }[]
}

export type MenuItemTag = 'vegan' | 'vegetarian' | 'spicy' | 'hit' | 'new' | 'gluten_free'

export interface MenuItem {
  id: string
  tenant_id: string
  category_id: string | null
  name: string
  name_en: string | null
  description: string | null
  base_price: number
  photo_url: string | null
  weight: string | null
  calories: number | null
  is_available: boolean
  is_hidden: boolean
  sort_order: number
  tags: MenuItemTag[]
  options: MenuItemOptions
  created_at: string
}

export interface QRCode {
  id: string
  tenant_id: string
  label: string
  table_number: string | null
  url: string
  scan_count: number
  created_at: string
}

export type OrderStatus = 'new' | 'accepted' | 'cooking' | 'ready' | 'done' | 'cancelled'

export interface Order {
  id: string
  tenant_id: string
  qr_code_id: string | null
  table_number: string | null
  status: OrderStatus
  total: number
  guest_note: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  name: string
  price: number
  quantity: number
  selected_options: Json
}

export interface Review {
  id: string
  tenant_id: string
  rating: number
  comment: string | null
  author_name: string
  is_visible: boolean
  reply: string | null
  created_at: string
}

export interface AnalyticsEvent {
  id: number
  tenant_id: string
  event_type: 'qr_scan' | 'menu_view' | 'item_view' | 'order_created'
  qr_code_id: string | null
  item_id: string | null
  meta: Json
  created_at: string
}

export interface TenantMember {
  id: string
  tenant_id: string
  user_id: string
  role: 'admin' | 'editor' | 'viewer'
}

// ─── Supabase Database type (for generic client typing) ───────────────────────

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: { id?: string; owner_id?: string; slug: string; name: string; description?: string | null; logo_url?: string | null; banner_url?: string | null; primary_color?: string; accent_color?: string; address?: string | null; phone?: string | null; instagram?: string | null; is_active?: boolean; plan?: 'free' | 'pro' | 'business'; working_hours?: Json; social_links?: Json; cuisine_type?: string | null; avg_check?: number | null; has_wifi?: boolean; has_delivery?: boolean; has_takeaway?: boolean; timezone?: string; theme?: 'dark' | 'light'; created_at?: string }
        Update: { id?: string; owner_id?: string; slug?: string; name?: string; description?: string | null; logo_url?: string | null; banner_url?: string | null; primary_color?: string; accent_color?: string; address?: string | null; phone?: string | null; instagram?: string | null; is_active?: boolean; plan?: 'free' | 'pro' | 'business'; working_hours?: Json; social_links?: Json; cuisine_type?: string | null; avg_check?: number | null; has_wifi?: boolean; has_delivery?: boolean; has_takeaway?: boolean; timezone?: string; theme?: 'dark' | 'light'; created_at?: string }
      }
      tenant_gallery: {
        Row: TenantGallery
        Insert: { id?: string; tenant_id: string; photo_url: string; sort_order?: number; created_at?: string }
        Update: { id?: string; tenant_id?: string; photo_url?: string; sort_order?: number; created_at?: string }
      }
      categories: {
        Row: Category
        Insert: { id?: string; tenant_id: string; name: string; name_en?: string | null; sort_order?: number; is_visible?: boolean; created_at?: string }
        Update: { id?: string; tenant_id?: string; name?: string; name_en?: string | null; sort_order?: number; is_visible?: boolean; created_at?: string }
      }
      menu_items: {
        Row: MenuItem
        Insert: { id?: string; tenant_id: string; category_id?: string | null; name: string; name_en?: string | null; description?: string | null; base_price: number; photo_url?: string | null; weight?: string | null; calories?: number | null; is_available?: boolean; is_hidden?: boolean; sort_order?: number; tags?: MenuItemTag[]; options?: MenuItemOptions; created_at?: string }
        Update: { id?: string; tenant_id?: string; category_id?: string | null; name?: string; name_en?: string | null; description?: string | null; base_price?: number; photo_url?: string | null; weight?: string | null; calories?: number | null; is_available?: boolean; is_hidden?: boolean; sort_order?: number; tags?: MenuItemTag[]; options?: MenuItemOptions; created_at?: string }
      }
      qr_codes: {
        Row: QRCode
        Insert: { id?: string; tenant_id: string; label: string; table_number?: string | null; url: string; scan_count?: number; created_at?: string }
        Update: { id?: string; tenant_id?: string; label?: string; table_number?: string | null; url?: string; scan_count?: number; created_at?: string }
      }
      orders: {
        Row: Order
        Insert: { id?: string; tenant_id: string; qr_code_id?: string | null; table_number?: string | null; status?: OrderStatus; total: number; guest_note?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; tenant_id?: string; qr_code_id?: string | null; table_number?: string | null; status?: OrderStatus; total?: number; guest_note?: string | null; created_at?: string; updated_at?: string }
      }
      order_items: {
        Row: OrderItem
        Insert: { id?: string; order_id: string; menu_item_id?: string | null; name: string; price: number; quantity?: number; selected_options?: Json }
        Update: { id?: string; order_id?: string; menu_item_id?: string | null; name?: string; price?: number; quantity?: number; selected_options?: Json }
      }
      reviews: {
        Row: Review
        Insert: { id?: string; tenant_id: string; rating: number; comment?: string | null; author_name?: string; is_visible?: boolean; reply?: string | null; created_at?: string }
        Update: { id?: string; tenant_id?: string; rating?: number; comment?: string | null; author_name?: string; is_visible?: boolean; reply?: string | null; created_at?: string }
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: { id?: number; tenant_id: string; event_type: 'qr_scan' | 'menu_view' | 'item_view' | 'order_created'; qr_code_id?: string | null; item_id?: string | null; meta?: Json; created_at?: string }
        Update: { id?: number; tenant_id?: string; event_type?: 'qr_scan' | 'menu_view' | 'item_view' | 'order_created'; qr_code_id?: string | null; item_id?: string | null; meta?: Json; created_at?: string }
      }
      tenant_members: {
        Row: TenantMember
        Insert: { id?: string; tenant_id: string; user_id: string; role?: 'admin' | 'editor' | 'viewer' }
        Update: { id?: string; tenant_id?: string; user_id?: string; role?: 'admin' | 'editor' | 'viewer' }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── UI / App types ───────────────────────────────────────────────────────────

export interface CartItem {
  menuItemId: string
  name: string
  basePrice: number
  quantity: number
  selectedVariant?: { name: string; price_delta: number }
  selectedModifiers?: { name: string; price: number }[]
  totalPrice: number
}


type DBTables = Database["public"]["Tables"];
let x: DBTables["analytics_events"]["Row"]["event_type"] = "qr_scan";
