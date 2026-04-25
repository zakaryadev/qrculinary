'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tenant, Category, MenuItem, MenuItemOptions, TenantGallery, MenuItemTag, MenuTag } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/lib/cart/store'
import { X, MapPin, Phone, Star, ShoppingCart, Info, Clock, Wifi, ShoppingBag, ExternalLink, Plus, ChefHat, Banknote, UtensilsCrossed, Search } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { getOpenStatus } from '@/lib/utils/workingHours'
import { t, t_ui, Lang } from '@/lib/utils/i18n'
import { TagBadgeList } from '@/components/ui/TagBadge'
import { SocialLinks } from '@/components/ui/SocialLinks'
import { CallButton } from '@/components/ui/CallButton'
import { formatPhone } from '@/lib/utils/phone'

interface Props {
  tenant: Tenant
  categories: Category[]
  items: MenuItem[]
  gallery: TenantGallery[]
  avgRating: number | null
  reviewCount: number
  tableNumber?: string
  allTags: MenuTag[]
}


export default function PublicMenuClient({ tenant, categories, items, gallery, avgRating, reviewCount, tableNumber, allTags }: Props) {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('ru')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Variant/modifier selections (by index)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0)
  const [selectedModifierIndices, setSelectedModifierIndices] = useState<number[]>([])
  const [addedAnim, setAddedAnim] = useState(false)
  const [mounted, setMounted] = useState(false)

  const setContext = useCartStore(s => s.setContext)
  const brandColor = tenant.primary_color || '#3ECF8E'
  const accentColor = tenant.accent_color || '#1C1C1C'
  const theme = tenant.theme || 'dark'
  
  const bgColor = theme === 'dark' ? '#0f0f0f' : '#f9fafb'
  const surfaceColor = theme === 'dark' ? '#1c1c1c' : '#ffffff'
  const textColor = theme === 'dark' ? '#ffffff' : '#111827'
  const textMuted = theme === 'dark' ? '#9ca3af' : '#6b7280'
  const borderColor = theme === 'dark' ? '#2d2d2d' : '#e5e7eb'

  const { isOpen, openTime, closeTime } = getOpenStatus(tenant.working_hours, tenant.timezone)
  const socialLinks: any = tenant.social_links || {}

  // Set context on mount
  useEffect(() => {
    setMounted(true)
    setContext(tenant.slug, tableNumber ?? null)
    const savedLang = localStorage.getItem('qr_lang') as Lang
    if (savedLang && ['ru', 'uz', 'en'].includes(savedLang)) setLang(savedLang)
  }, [tenant.slug, tableNumber, setContext])

  const changeLang = (l: Lang) => {
    setLang(l)
    localStorage.setItem('qr_lang', l)
  }

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const availableTagsSlugs = allTags.filter(tag => 
    items.some(item => 
      (!activeCat || item.category_id === activeCat) && 
      item.tags.includes(tag.slug as any)
    )
  ).map(t => t.slug)

  const filtered = items.filter(item => {
    if (activeCat && item.category_id !== activeCat) return false
    if (activeTags.length && !activeTags.every(t => item.tags.includes(t as any))) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = t(item, lang, 'name').toLowerCase().includes(q)
      const descMatch = t(item, lang, 'description').toLowerCase().includes(q)
      if (!nameMatch && !descMatch) return false
    }
    return true
  })

  const resetFilters = () => {
    setSearchQuery('')
    setActiveTags([])
  }

  const openItem = (item: MenuItem) => {
    setSelectedItem(item)
    setSelectedVariantIdx(0)
    setSelectedModifierIndices([])

    trackEvent({
      tenantId: tenant.id,
      eventType: 'item_view',
      itemId: item.id,
      meta: {
        item_name: item.name,
        base_price: item.base_price,
      }
    })
  }

  const toggleModifier = (idx: number) => {
    setSelectedModifierIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  const currentPrice = (item: MenuItem) => {
    const opts = item.options as MenuItemOptions
    const base = item.base_price
    const varDelta = opts.variants?.[selectedVariantIdx]?.price_delta ?? 0
    const modTotal = selectedModifierIndices.reduce((s, idx) => s + (opts.modifiers?.[idx]?.price ?? 0), 0)
    return base + varDelta + modTotal
  }

  const addItem = useCartStore(s => s.addItem)
  const handleAddToCart = () => {
    if (!selectedItem) return
    const opts = selectedItem.options as MenuItemOptions
    const variant = opts.variants?.[selectedVariantIdx]
    const activeModifiers = selectedModifierIndices
      .map(idx => opts.modifiers?.[idx])
      .filter(Boolean) as { name: string; price: number }[]

    addItem({
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      photo_url: selectedItem.photo_url || '',
      basePrice: selectedItem.base_price,
      options: {
        variant: variant ? { ...variant, name: variant.name || 'Стандарт' } : undefined,
        modifiers: activeModifiers.length ? activeModifiers : undefined,
      },
    })
    setAddedAnim(true)
    setTimeout(() => setAddedAnim(false), 600)
    setSelectedItem(null)
  }

  const cartCount = useCartStore(s => s.count())

  return (
    <div className="min-h-screen pb-28" style={{ 
      background: bgColor, color: textColor,
      '--brand': brandColor,
      '--bg': bgColor,
      '--border': borderColor,
      '--surface': surfaceColor,
      '--text-primary': textColor,
      '--text-muted': textMuted,
    } as React.CSSProperties}>
      {/* ─── Fixed Language Switcher ─── */}
      <div className="fixed top-4 right-4 z-[60] flex items-center gap-1 p-1 rounded-xl border bg-black/30 backdrop-blur-md shadow-xl transition-all active:scale-95" 
           style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
        <button onClick={() => changeLang('ru')} className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'ru' ? 'bg-[var(--brand)] text-black shadow-sm' : 'text-white/70 hover:text-white'}`}>RU</button>
        <button onClick={() => changeLang('uz')} className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'uz' ? 'bg-[var(--brand)] text-black shadow-sm' : 'text-white/70 hover:text-white'}`}>UZ</button>
        <button onClick={() => changeLang('en')} className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'en' ? 'bg-[var(--brand)] text-black shadow-sm' : 'text-white/70 hover:text-white'}`}>EN</button>
      </div>

      {/* Banner */}
      <div className="h-40 sm:h-56 w-full overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${brandColor}40, ${brandColor}10)` }}>
        {tenant.banner_url && (
            <img src={tenant.banner_url} alt={tenant.name} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Header Info */}
      <div className="px-4 pt-6 pb-6 max-w-2xl mx-auto -mt-12 sm:-mt-16 relative z-10">
        <div className="card shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-3">
                {tenant.logo_url ? (
                  <img src={tenant.logo_url} alt={tenant.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm border" style={{ borderColor }} />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm border"
                    style={{ background: brandColor, color: '#000', borderColor }}>
                    {tenant.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold truncate tracking-tight">{tenant.name}</h1>
                  {(avgRating !== null && reviewCount > 0) && (
                    <div className="flex items-center gap-1.5 mt-1 -ml-0.5">
                      <Star size={16} fill={brandColor} stroke="none" />
                      <span className="font-bold text-sm">{avgRating.toFixed(1)}</span>
                      <span className="text-sm" style={{ color: textMuted }}>({reviewCount})</span>
                    </div>
                  )}
                  {tenant.call_center_phone && (
                    <div className="flex items-center gap-2 mt-2">
                      <a href={`tel:${tenant.call_center_phone.replace(/\D/g, '')}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border hover:scale-105 transition-transform"
                        style={{ borderColor: brandColor, color: brandColor, background: `${brandColor}15` }}>
                        <Phone size={14} />
                        {formatPhone(tenant.call_center_phone)}
                      </a>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
          
          {tenant.description && (
            <p className="text-sm mt-4 leading-relaxed" style={{ color: textMuted }}>
              {t(tenant, lang, 'description')}
            </p>
          )}
        </div>

        {/* Status & Info Highlights */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border"
            style={{ 
              borderColor: isOpen ? `${brandColor}40` : 'rgba(239,68,68,0.4)',
              background: isOpen ? `${brandColor}10` : 'rgba(239,68,68,0.1)',
              color: isOpen ? brandColor : '#ef4444' 
            }}>
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[var(--brand)]' : 'bg-red-500'} animate-pulse`} />
            {isOpen ? `Открыто · до ${closeTime || '...'}` : `Закрыто · откроется в ${openTime || '...'}`}
          </div>
          
          {tenant.cuisine_type && (
            <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border" style={{ borderColor, background: surfaceColor }}>
              <ChefHat size={14} style={{ color: brandColor }} />
              {tenant.cuisine_type}
            </div>
          )}
          
          {tenant.avg_check != null && tenant.avg_check > 0 && (
            <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border" style={{ borderColor, background: surfaceColor }}>
              <Banknote size={14} style={{ color: brandColor }} />
              ~{tenant.avg_check.toLocaleString('ru-RU')} сум
            </div>
          )}
        </div>

        {/* Icon Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-6" style={{ color: textMuted }}>
          {tenant.address && (() => {
            const t = tenant as any
            const hasCoords = t.lat && t.lng
            // geo: URI opens native Maps on iOS & Android; fallback to Google Maps on desktop
            const mapsHref = hasCoords
              ? `geo:${t.lat},${t.lng}?q=${t.lat},${t.lng}(${encodeURIComponent(tenant.address ?? '')})`
              : `https://maps.google.com/?q=${encodeURIComponent(tenant.address ?? '')}`
            return (
              <a href={mapsHref}
                className="flex items-center gap-2 hover:opacity-75 transition-opacity">
                <MapPin size={16} className="text-[var(--brand)] shrink-0"/>
                <span className="truncate">{tenant.address}</span>
              </a>
            )
          })()}
          {tenant.phone && (
            <a href={`tel:${tenant.phone.replace(/[\s\-()]/g, '')}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <Phone size={16} className="text-[var(--brand)] shrink-0"/>
              <span className="truncate">{tenant.phone}</span>
            </a>
          )}
          {tenant.has_wifi && (
            <div className="flex items-center gap-2"><Wifi size={16} className="text-[var(--brand)] shrink-0"/> Wi-Fi</div>
          )}
          {(tenant.has_delivery || tenant.has_takeaway) && (
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-[var(--brand)] shrink-0"/> 
              {tenant.has_delivery && tenant.has_takeaway ? 'Доставка / Навынос' : tenant.has_delivery ? 'Доставка' : 'Навынос'}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className="mb-2">
          <SocialLinks
            socialLinks={socialLinks}
            borderColor={borderColor}
            background={surfaceColor}
            textColor={textColor}
          />
        </div>

        {tableNumber && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-sm border border-[var(--brand)]/20"
            style={{ background: `${brandColor}18`, color: brandColor }}>
            <UtensilsCrossed size={16} />
            Стол {tableNumber}
          </div>
        )}
      </div>

      {/* Gallery Scroll */}
      {gallery.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
            {gallery.map(img => (
              <button key={img.id} onClick={() => setLightboxImage(img.photo_url)} 
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl flex-shrink-0 snap-center overflow-hidden border transition-transform hover:scale-[1.02] active:scale-95"
                style={{ borderColor }}>
                <img src={img.photo_url} alt="Gallery" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox for Gallery */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
          <img src={lightboxImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Category Tabs */}
      <div className="sticky top-0 z-20 border-b shadow-sm backdrop-blur-md" style={{ background: `${bgColor}f2`, borderColor }}>
        <div className="max-w-2xl mx-auto px-4 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 py-3 min-w-max">
              <button onClick={() => setActiveCat(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95`}
                style={{
                  background: activeCat === null ? brandColor : surfaceColor,
                  color: activeCat === null ? '#000' : textColor,
                  border: `1px solid ${activeCat === null ? brandColor : borderColor}`
                }}>
                {t_ui('all', lang)}
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95`}
                  style={{
                    background: activeCat === cat.id ? brandColor : surfaceColor,
                    color: activeCat === cat.id ? '#000' : textColor,
                    border: `1px solid ${activeCat === cat.id ? brandColor : borderColor}`
                  }}>
                  {t(cat, lang, 'name')}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: textMuted }} />
          <input
            type="text"
            placeholder={t_ui('search', lang)}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all shadow-sm text-sm font-medium"
            style={{ 
              background: surfaceColor, 
              borderColor: searchQuery ? brandColor : borderColor,
              color: textColor
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tags */}
        {availableTagsSlugs.length > 0 && (
          <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
            <div className="flex gap-2 min-w-max pb-1">
              {allTags.filter(t => availableTagsSlugs.includes(t.slug)).map(tag => (
                <button key={tag.id} onClick={() => toggleTag(tag.slug)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap shadow-sm hover:scale-[1.02] active:scale-95"
                  style={{
                    background: activeTags.includes(tag.slug) ? `${brandColor}18` : surfaceColor,
                    color: activeTags.includes(tag.slug) ? brandColor : textMuted,
                    borderColor: activeTags.includes(tag.slug) ? brandColor : borderColor,
                  }}>
                  {lang === 'uz' ? tag.name_uz : lang === 'en' ? tag.name_en : tag.name_ru}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Active Filters Summary */}
        {(activeTags.length > 0 || searchQuery) && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium" style={{ color: textMuted }}>
              {t_ui('found', lang)}: {filtered.length}
            </span>
            <button onClick={resetFilters} className="text-xs font-bold transition-opacity hover:opacity-75" style={{ color: brandColor }}>
              {t_ui('reset', lang)}
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <Search size={36} className="mx-auto mb-3 opacity-40" />
            <p>{t_ui('not_found', lang)}</p>
          </div>
        )}

        {filtered.map(item => (
          <button key={item.id} onClick={() => openItem(item)}
            className={`w-full text-left rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm overflow-hidden relative`}
            style={{ 
              padding: '0.875rem', 
              background: surfaceColor, 
              border: item.is_promo ? `2px solid ${brandColor}` : `1px solid ${borderColor}`
            }}>
            {item.is_promo && item.promo_label && (
              <div className="absolute top-0 right-0 text-black font-extrabold text-[10px] uppercase px-3 py-1 tracking-wider rounded-bl-xl z-10 shadow-sm"
                   style={{ background: brandColor }}>
                {item.promo_label}
              </div>
            )}
            <div className="flex gap-3 sm:gap-4 relative z-0 mt-1">
              {item.photo_url ? (
                <img src={item.photo_url} alt={item.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--surface-2)' }}>
                  <UtensilsCrossed size={28} style={{ opacity: 0.3 }} />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div className={item.is_promo && item.promo_label ? 'pr-16' : ''}>
                  <div className="font-bold text-base mb-1 truncate leading-tight">{t(item, lang, 'name')}</div>
                  {t(item, lang, 'description') && (
                    <p className="text-xs line-clamp-2 mb-2 leading-relaxed" style={{ color: textMuted }}>{t(item, lang, 'description')}</p>
                  )}
                </div>
                <div>
                  <div className="mb-2">
                    <TagBadgeList tags={allTags} activeSlugs={item.tags as any} lang={lang} />
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="leading-none">
                      {item.is_promo && item.old_price ? (
                        <div className="flex flex-col mb-0.5">
                          <span className="text-xs line-through opacity-60" style={{ color: textMuted }}>
                            {formatPrice(item.old_price)}
                          </span>
                          <span className="font-extrabold text-base" style={{ color: brandColor }}>
                            {formatPrice(item.base_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-base" style={{ color: brandColor }}>{formatPrice(item.base_price)}</span>
                      )}
                      {item.weight && <div className="text-xs font-medium mt-0.5" style={{ color: textMuted }}>{item.weight}</div>}
                    </div>
                    <span className="text-sm w-8 h-8 flex items-center justify-center rounded-xl font-bold transition-transform hover:scale-110"
                      style={{ background: brandColor, color: '#000' }}>
                      <Plus size={18} strokeWidth={3} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Floating Cart Button ─── */}
      {mounted && cartCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
          <button
            onClick={() => router.push(`/menu/${tenant.slug}/cart`)}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: brandColor, color: '#000', minWidth: 260 }}>
            <div className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#000', color: brandColor }}>
                {cartCount}
              </span>
            </div>
            <span className="flex-1 text-left font-semibold">{t_ui('cart', lang)}</span>
            <span className="font-bold">{formatPrice(useCartStore.getState().total())}</span>
          </button>
        </div>
      )}

      {/* ─── Item Detail / Add to Cart Modal ─── */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedItem(null)}>
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom"
            style={{ background: surfaceColor, color: textColor }}
            onClick={e => e.stopPropagation()}>

            {selectedItem.photo_url && (
              <img src={selectedItem.photo_url} alt={selectedItem.name} className="w-full h-48 object-cover" />
            )}

            <div className="p-5 sm:p-6 pb-24">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-2xl font-black leading-tight pr-4">{selectedItem.name}</h2>
                <button onClick={() => setSelectedItem(null)} className="flex-shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {selectedItem.description && (
                <p className="text-sm mb-4 leading-relaxed" style={{ color: textMuted }}>{selectedItem.description}</p>
              )}

              <div className="flex gap-4 mb-6 text-sm font-medium" style={{ color: textMuted }}>
                {selectedItem.weight && <span className="flex items-center gap-1.5"><MapPin size={16}/> {selectedItem.weight}</span>}
                {selectedItem.calories && <span className="flex items-center gap-1.5">🔥 {selectedItem.calories} ккал</span>}
              </div>

              {/* Variants */}
              {(() => {
                const opts = selectedItem.options as MenuItemOptions
                return opts.variants && opts.variants.length > 0 ? (
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">{t_ui('size', lang)}</div>
                    <div className="flex gap-2 flex-wrap">
                      {opts.variants.map((v, i) => (
                        <button key={`${v.name || 'v'}-${i}`} onClick={() => setSelectedVariantIdx(i)}
                          className="px-4 py-2 rounded-lg text-sm border transition-all"
                          style={{
                            background: selectedVariantIdx === i ? `${brandColor}15` : 'transparent',
                            borderColor: selectedVariantIdx === i ? brandColor : borderColor,
                            color: selectedVariantIdx === i ? brandColor : textMuted,
                          }}>
                          {v.name || 'Стандарт'}
                          {v.price_delta > 0 && <span className="ml-1 text-xs">+{formatPrice(v.price_delta)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Modifiers */}
              {(() => {
                const opts = selectedItem.options as MenuItemOptions
                return opts.modifiers && opts.modifiers.length > 0 ? (
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">{t_ui('additions', lang)}</div>
                    {opts.modifiers.map((mod, i) => (
                      <button key={`${mod.name || 'm'}-${i}`} onClick={() => toggleModifier(i)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-2 border transition-all"
                        style={{
                          background: selectedModifierIndices.includes(i) ? `${brandColor}10` : 'transparent',
                          borderColor: selectedModifierIndices.includes(i) ? brandColor : borderColor,
                          color: textColor,
                        }}>
                        <span className="font-medium">{mod.name || 'Добавка'}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: textMuted }}>+{formatPrice(mod.price)}</span>
                          <div className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                            style={{
                              background: selectedModifierIndices.includes(i) ? brandColor : 'transparent',
                              color: selectedModifierIndices.includes(i) ? '#000' : textMuted,
                              border: selectedModifierIndices.includes(i) ? 'none' : `1px solid ${borderColor}`
                            }}>
                            {selectedModifierIndices.includes(i) ? '✓' : '+'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null
              })()}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <TagBadgeList tags={allTags} activeSlugs={selectedItem.tags as any} lang={lang} />
              </div>
            </div>

            {/* Sticky Add to Cart Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)] to-transparent">
              <div className="flex items-center justify-between p-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: textMuted }}>{t_ui('total', lang)}</div>
                  <div className="text-3xl font-black" style={{ color: brandColor }}>
                    {formatPrice(currentPrice(selectedItem))}
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="text-base font-bold px-8 py-3.5 rounded-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg"
                  style={{ background: addedAnim ? '#2ea87a' : brandColor, color: '#000' }}>
                  {addedAnim ? t_ui('added', lang) : <><Plus size={20} strokeWidth={3} /> {t_ui('add_to_cart', lang)}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Call Center Button on Mobile */}
      {mounted && tenant.show_call_button && tenant.call_center_phone && (
        <CallButton phone={tenant.call_center_phone} brandColor={brandColor} />
      )}
    </div>
  )
}
