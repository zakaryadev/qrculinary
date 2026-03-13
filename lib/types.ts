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
  call_center_phone?: string | null
  show_call_button?: boolean
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
  lat: number | null
  lng: number | null
  description_uz?: string | null
  description_en?: string | null
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
  name_ru?: string | null
  name_uz?: string | null
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
  name_ru?: string | null
  name_uz?: string | null
  name_en: string | null
  description: string | null
  description_ru?: string | null
  description_uz?: string | null
  description_en?: string | null
  base_price: number
  old_price?: number | null
  photo_url: string | null
  weight: string | null
  calories: number | null
  is_available: boolean
  is_hidden: boolean
  is_promo?: boolean
  promo_label?: string | null
  promo_ends_at?: string | null
  sort_order: number
  tags: MenuItemTag[]
  options: MenuItemOptions
  created_at: string
}

export interface QRCode {
  id: string
  tenant_id: string
  branch_id?: string | null
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

export interface Branch {
  id: string
  tenant_id: string
  name: string
  slug: string
  address: string
  phone: string | null
  lat: number | null
  lng: number | null
  working_hours: Json
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface PromoBanner {
  id: string
  tenant_id: string
  title: string
  image_url: string | null
  link_url: string | null
  sort_order: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

// ─── Supabase Database type (for generic client typing) ───────────────────────

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: Omit<Tenant, 'id' | 'created_at'> & { id?: string; created_at?: string; description?: string | null; logo_url?: string | null; banner_url?: string | null; primary_color?: string; accent_color?: string; address?: string | null; phone?: string | null; instagram?: string | null; is_active?: boolean; plan?: 'free' | 'pro' | 'business'; working_hours?: Json; social_links?: Json; cuisine_type?: string | null; avg_check?: number | null; has_wifi?: boolean; has_delivery?: boolean; has_takeaway?: boolean; timezone?: string; theme?: 'dark' | 'light' }
        Update: Partial<Tenant>
      }
      tenant_gallery: {
        Row: TenantGallery
        Insert: Omit<TenantGallery, 'id' | 'created_at'> & { id?: string; created_at?: string; sort_order?: number }
        Update: Partial<TenantGallery>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'> & { id?: string; created_at?: string; name_en?: string | null; sort_order?: number; is_visible?: boolean }
        Update: Partial<Category>
      }
      menu_items: {
        Row: MenuItem
        Insert: Omit<MenuItem, 'id' | 'created_at'> & { id?: string; created_at?: string; category_id?: string | null; name_en?: string | null; description?: string | null; photo_url?: string | null; weight?: string | null; calories?: number | null; is_available?: boolean; is_hidden?: boolean; sort_order?: number; tags?: MenuItemTag[]; options?: MenuItemOptions }
        Update: Partial<MenuItem>
      }
      qr_codes: {
        Row: QRCode
        Insert: Omit<QRCode, 'id' | 'created_at'> & { id?: string; created_at?: string; table_number?: string | null; scan_count?: number }
        Update: Partial<QRCode>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string; qr_code_id?: string | null; table_number?: string | null; status?: OrderStatus; guest_note?: string | null }
        Update: Partial<Order>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id'> & { id?: string; menu_item_id?: string | null; quantity?: number; selected_options?: Json }
        Update: Partial<OrderItem>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'> & { id?: string; created_at?: string; comment?: string | null; is_visible?: boolean; reply?: string | null }
        Update: Partial<Review>
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: Omit<AnalyticsEvent, 'id' | 'created_at'> & { id?: number; created_at?: string; qr_code_id?: string | null; item_id?: string | null; meta?: Json }
        Update: Partial<AnalyticsEvent>
      }
      tenant_members: {
        Row: TenantMember
        Insert: Omit<TenantMember, 'id'> & { id?: string; role?: 'admin' | 'editor' | 'viewer' }
        Update: Partial<TenantMember>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
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
