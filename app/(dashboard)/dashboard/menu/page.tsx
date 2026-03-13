'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category, MenuItem, MenuItemTag, Tenant } from '@/lib/types'
import { formatPrice, TAG_LABELS } from '@/lib/utils'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, GripVertical } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableCategoryRow({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 1, position: 'relative' as const }
  const dragHandle = (
    <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 mr-1 p-1 -ml-2 rounded hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" style={{ touchAction: 'none' }}>
        <GripVertical size={14} />
    </div>
  )
  return (
    <div ref={setNodeRef} style={style} className="mb-1 group flex items-center">
      {dragHandle}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}

function SortableItemRow({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : 1, position: 'relative' as const, padding: '1rem' }
  return (
    <div ref={setNodeRef} style={style} className={`card flex items-center gap-4 ${isDragging ? 'shadow-xl opacity-90 border-[var(--brand)]' : ''}`}>
      {!disabled && (
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 rounded hover:bg-black/5 dark:hover:bg-white/5 p-1" style={{ touchAction: 'none' }}>
          <GripVertical size={16} />
        </div>
      )}
      {children}
    </div>
  )
}

export default function MenuPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [availFilter, setAvailFilter] = useState<'all'|'available'|'hidden'>('all')
  const [filterTags, setFilterTags] = useState<MenuItemTag[]>([])

  // Modals
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // Category form
  const [catForm, setCatForm] = useState({ name_ru: '', name_uz: '', name_en: '' })
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatForm, setEditCatForm] = useState({ name_ru: '', name_uz: '', name_en: '' })

  // Item form
  const [itemForm, setItemForm] = useState({
    name_ru: '', name_uz: '', name_en: '', description_ru: '', description_uz: '', description_en: '', base_price: '', weight: '', calories: '',
    is_promo: false, promo_label: '', old_price: '', promo_ends_at: '',
    tags: [] as MenuItemTag[],
    variants: [] as { name: string; price_delta: string }[],
    modifiers: [] as { name: string; price: string }[],
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !tenantId) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    const newCategories = arrayMove(categories, oldIndex, newIndex)
    setCategories(newCategories)

    const updates = newCategories.map((cat, index) => ({
      ...cat,
      sort_order: index
    }))
    await supabase.from('categories').upsert(updates)
  }

  const handleItemDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !tenantId) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index
    }))
    await Promise.all(updates.map(u => supabase.from('menu_items').update({ sort_order: u.sort_order }).eq('id', u.id)))
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('*').eq('owner_id', user.id).single() as { data: Tenant | null; error: unknown }
      if (!tenant) return
      setTenantId(tenant.id)
      setTenantSlug(tenant.slug)
      fetchCategories(tenant.id)
    }
    load()
  }, [])

  const fetchCategories = async (tid: string) => {
    const { data } = await supabase.from('categories').select('*').eq('tenant_id', tid).order('sort_order')
    setCategories(data ?? [])
    if (data?.length && !selectedCat) {
      setSelectedCat(data[0].id)
      fetchItems(tid, data[0].id)
    }
  }

  const fetchItems = async (tid: string, catId: string) => {
    const { data } = await supabase.from('menu_items').select('*')
      .eq('tenant_id', tid).eq('category_id', catId).order('sort_order')
    setItems(data ?? [])
  }

  const handleSelectCat = (catId: string) => {
    setSelectedCat(catId)
    if (tenantId) fetchItems(tenantId, catId)
  }

  // ── Category CRUD ──────────────────────────────────────────
  const createCategory = async () => {
    if (!tenantId || !catForm.name_ru.trim()) return
    await supabase.from('categories').insert({ tenant_id: tenantId, name: catForm.name_ru.trim(), name_ru: catForm.name_ru.trim(), name_uz: catForm.name_uz.trim(), name_en: catForm.name_en.trim(), sort_order: categories.length })
    setCatForm({ name_ru: '', name_uz: '', name_en: '' })
    setShowCatForm(false)
    fetchCategories(tenantId)
  }

  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id)
    setEditCatForm({ name_ru: cat.name_ru || cat.name, name_uz: cat.name_uz || '', name_en: cat.name_en || '' })
  }

  const saveEditCategory = async (id: string) => {
    if (!editCatForm.name_ru.trim()) {
      setEditingCatId(null)
      return
    }
    await supabase.from('categories').update({ name: editCatForm.name_ru.trim(), name_ru: editCatForm.name_ru.trim(), name_uz: editCatForm.name_uz.trim(), name_en: editCatForm.name_en.trim() }).eq('id', id)
    setEditingCatId(null)
    fetchCategories(tenantId!)
  }

  const cancelEditCategory = () => {
    setEditingCatId(null)
    setEditCatForm({ name_ru: '', name_uz: '', name_en: '' })
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию? Блюда не удалятся.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCategories(tenantId!)
  }

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 800 })
    setPhotoFile(compressed as File)
    setPhotoPreview(URL.createObjectURL(compressed))
  }

  // ── Item CRUD ─────────────────────────────────────────────
  const openNewItem = () => {
    setEditingItem(null)
    setItemForm({ 
      name_ru: '', name_uz: '', name_en: '', description_ru: '', description_uz: '', description_en: '', base_price: '', weight: '', calories: '', tags: [],
      is_promo: false, promo_label: '', old_price: '', promo_ends_at: '',
      variants: [], modifiers: [] 
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setShowItemForm(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    
    // Parse options safely
    let parsedVariants: { name: string; price_delta: string }[] = []
    let parsedMods: { name: string; price: string }[] = []
    if (item.options) {
      const opts = item.options as any
      if (Array.isArray(opts.variants)) {
        parsedVariants = opts.variants.map((v: any) => ({ name: v.name, price_delta: String(v.price_delta || '') }))
      }
      if (Array.isArray(opts.modifiers)) {
        parsedMods = opts.modifiers.map((m: any) => ({ name: m.name, price: String(m.price || '') }))
      }
    }

    setItemForm({
      name_ru: item.name_ru || item.name,
      name_uz: item.name_uz || '',
      name_en: item.name_en || '',
      description_ru: item.description_ru || item.description || '',
      description_uz: item.description_uz || '',
      description_en: item.description_en || '',
      base_price: String(item.base_price),
      weight: item.weight ?? '',
      calories: item.calories ? String(item.calories) : '',
      is_promo: item.is_promo ?? false,
      promo_label: item.promo_label ?? '',
      old_price: item.old_price ? String(item.old_price) : '',
      promo_ends_at: item.promo_ends_at ? new Date(item.promo_ends_at).toISOString().slice(0, 16) : '',
      tags: item.tags as MenuItemTag[],
      variants: parsedVariants,
      modifiers: parsedMods,
    })
    setPhotoPreview(item.photo_url)
    setPhotoFile(null)
    setShowItemForm(true)
  }

  const saveItem = async () => {
    if (!tenantId || !selectedCat) return
    setSaving(true)

    let photo_url = editingItem?.photo_url ?? null

    if (photoFile) {
      const ext = 'webp'
      const path = `${tenantId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('menu-photos').upload(path, photoFile, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('menu-photos').getPublicUrl(path)
        photo_url = publicUrl
      }
    }

    const payload = {
      tenant_id: tenantId,
      category_id: selectedCat,
      name: itemForm.name_ru,
      name_ru: itemForm.name_ru,
      name_uz: itemForm.name_uz || null,
      name_en: itemForm.name_en || null,
      description: itemForm.description_ru || null,
      description_ru: itemForm.description_ru || null,
      description_uz: itemForm.description_uz || null,
      description_en: itemForm.description_en || null,
      base_price: parseFloat(itemForm.base_price),
      weight: itemForm.weight || null,
      calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      is_promo: itemForm.is_promo,
      promo_label: itemForm.promo_label || null,
      old_price: itemForm.old_price ? parseFloat(itemForm.old_price) : null,
      promo_ends_at: itemForm.promo_ends_at ? new Date(itemForm.promo_ends_at).toISOString() : null,
      tags: itemForm.tags,
      photo_url,
      options: {
        variants: itemForm.variants.length > 0 ? itemForm.variants.map(v => ({
          name: v.name,
          price_delta: parseFloat(v.price_delta) || 0
        })) : undefined,
        modifiers: itemForm.modifiers.length > 0 ? itemForm.modifiers.map(m => ({
          name: m.name,
          price: parseFloat(m.price) || 0
        })) : undefined,
      }
    }

    if (editingItem) {
      await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
    } else {
      await supabase.from('menu_items').insert({ ...payload, sort_order: items.length })
    }

    setShowItemForm(false)
    setSaving(false)
    fetchItems(tenantId, selectedCat)
  }

  const toggleAvailable = async (item: MenuItem) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    fetchItems(tenantId!, selectedCat!)
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить блюдо?')) return
    await supabase.from('menu_items').delete().eq('id', id)
    fetchItems(tenantId!, selectedCat!)
  }

  const toggleTag = (tag: MenuItemTag) => {
    setItemForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }))
  }

  const toggleFilterTag = (tag: MenuItemTag) => {
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const filteredItems = items.filter(i => {
    if (i.category_id !== selectedCat) return false
    if (availFilter === 'available' && !i.is_available) return false
    if (availFilter === 'hidden' && i.is_available) return false
    if (filterTags.length && !filterTags.every(t => i.tags.includes(t))) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!i.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Handlers for dynamic array fields
  const addVariant = () => setItemForm(p => ({ ...p, variants: [...p.variants, { name: '', price_delta: '' }] }))
  const updateVariant = (idx: number, field: string, val: any) => {
    const newVars = [...itemForm.variants]
    newVars[idx] = { ...newVars[idx], [field]: val }
    setItemForm(p => ({ ...p, variants: newVars }))
  }
  const removeVariant = (idx: number) => setItemForm(p => ({ ...p, variants: p.variants.filter((_, i) => i !== idx) }))

  const addModifier = () => setItemForm(p => ({ ...p, modifiers: [...p.modifiers, { name: '', price: '' }] }))
  const updateModifier = (idx: number, field: string, val: any) => {
    const newMods = [...itemForm.modifiers]
    newMods[idx] = { ...newMods[idx], [field]: val }
    setItemForm(p => ({ ...p, modifiers: newMods }))
  }
  const removeModifier = (idx: number) => setItemForm(p => ({ ...p, modifiers: p.modifiers.filter((_, i) => i !== idx) }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Меню</h1>
        <a href={`/menu/${tenantSlug}`} target="_blank" className="btn-ghost text-sm w-full sm:w-auto justify-center">
          Открыть меню ↗
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories sidebar / Mobile horizontal nav */}
        <div className="w-full lg:w-60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>КАТЕГОРИИ</span>
            <button onClick={() => setShowCatForm(true)} className="w-6 h-6 flex items-center justify-center rounded"
              style={{ color: 'var(--brand)', background: 'rgba(62,207,142,0.12)' }}>
              <Plus size={14} />
            </button>
          </div>

          {showCatForm && (
            <div className="mb-2 flex flex-col gap-1 p-2 bg-white dark:bg-black/20 rounded-lg border w-full">
              <input className="input text-sm py-1.5" placeholder="Название (RU) *" value={catForm.name_ru}
                onChange={e => setCatForm(p => ({ ...p, name_ru: e.target.value }))} autoFocus />
              <input className="input text-sm py-1.5" placeholder="Название (UZ)" value={catForm.name_uz}
                onChange={e => setCatForm(p => ({ ...p, name_uz: e.target.value }))} />
              <input className="input text-sm py-1.5" placeholder="Название (EN)" value={catForm.name_en}
                onChange={e => setCatForm(p => ({ ...p, name_en: e.target.value }))} />
              <div className="flex gap-2 mt-1">
                <button onClick={createCategory} className="btn-primary text-xs px-2 py-1 flex-1">Добавить</button>
                <button onClick={() => setShowCatForm(false)} className="btn-ghost text-xs px-2 py-1 flex-1">Отмена</button>
              </div>
            </div>
          )}

          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
              <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {categories.map(cat => (
                  <SortableCategoryRow key={cat.id} id={cat.id}>
                    {editingCatId === cat.id ? (
                      <div className="flex flex-col gap-1 p-2 bg-white dark:bg-black/20 rounded-lg border w-60 flex-shrink-0 lg:w-full" style={{ borderColor: 'var(--border)' }}>
                        <input value={editCatForm.name_ru} onChange={e => setEditCatForm(p => ({ ...p, name_ru: e.target.value }))} className="input px-2 py-1 text-sm bg-transparent border-none" autoFocus placeholder="RU *" />
                        <input value={editCatForm.name_uz} onChange={e => setEditCatForm(p => ({ ...p, name_uz: e.target.value }))} className="input px-2 py-1 text-sm bg-transparent border-none" placeholder="UZ" />
                        <input value={editCatForm.name_en} onChange={e => setEditCatForm(p => ({ ...p, name_en: e.target.value }))} className="input px-2 py-1 text-sm bg-transparent border-none" placeholder="EN" />
                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => saveEditCategory(cat.id)} className="p-1 px-3 text-xs font-bold text-green-500 hover:bg-green-500/10 rounded">OK</button>
                          <button onClick={cancelEditCategory} className="p-1 px-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded">X</button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleSelectCat(cat.id)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all group w-48 lg:w-full flex-shrink-0"
                        style={{
                          background: selectedCat === cat.id ? 'rgba(62,207,142,0.12)' : 'transparent',
                          color: selectedCat === cat.id ? 'var(--brand)' : 'var(--text-secondary)',
                        }}>
                        <span className="text-sm font-medium truncate">{cat.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); startEditCategory(cat) }} className="p-1 hover:bg-[var(--surface-2)] rounded">
                            <Pencil size={12} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteCategory(cat.id) }} className="p-1 hover:bg-red-500/10 text-red-500 rounded">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </SortableCategoryRow>
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {categories.length === 0 && (
            <div className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>
              Нет категорий.<br />Создайте первую.
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">{categories.find(c => c.id === selectedCat)?.name ?? 'Выберите категорию'}</h2>
              {selectedCat && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filteredItems.length} блюд</p>}
            </div>
            {selectedCat && (
              <button onClick={openNewItem} className="btn-primary text-sm">
                <Plus size={16} /> Добавить блюдо
              </button>
            )}
          </div>

          {selectedCat && (
            <div className="card p-4 mb-4 space-y-4" style={{ background: 'var(--surface-2)' }}>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input w-full pl-9 py-2 text-sm"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ pointerEvents: 'none' }}>🔍</div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
                      <X size={14} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-1 bg-white dark:bg-black/20 p-1 rounded-lg border w-full sm:w-auto" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setAvailFilter('all')} className={`flex-1 px-3 py-1 text-xs rounded-md transition-colors ${availFilter === 'all' ? 'bg-[var(--brand)] text-black font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>Все</button>
                  <button onClick={() => setAvailFilter('available')} className={`flex-1 px-3 py-1 text-xs rounded-md transition-colors ${availFilter === 'available' ? 'bg-[var(--brand)] text-black font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>Доступны</button>
                  <button onClick={() => setAvailFilter('hidden')} className={`flex-1 px-3 py-1 text-xs rounded-md transition-colors ${availFilter === 'hidden' ? 'bg-[var(--brand)] text-black font-semibold shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>Скрыты</button>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(TAG_LABELS) as MenuItemTag[]).map(tag => (
                  <button key={tag} onClick={() => toggleFilterTag(tag)}
                    className="text-xs px-2.5 py-1 rounded-md border transition-all"
                    style={{
                      background: filterTags.includes(tag) ? 'var(--brand)' : 'var(--surface)',
                      color: filterTags.includes(tag) ? '#000' : 'var(--text-secondary)',
                      borderColor: filterTags.includes(tag) ? 'var(--brand)' : 'var(--border)',
                      fontWeight: filterTags.includes(tag) ? 600 : 400
                    }}>
                    {TAG_LABELS[tag].label}
                  </button>
                ))}
                {(searchQuery || availFilter !== 'all' || filterTags.length > 0) && (
                  <button onClick={() => { setSearchQuery(''); setAvailFilter('all'); setFilterTags([]); }} 
                    className="text-xs px-2.5 py-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors font-medium">
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && selectedCat && (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-sm">В этой категории пока нет блюд</p>
            </div>
          )}

          <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {filteredItems.map(item => (
                  <SortableItemRow key={item.id} id={item.id} disabled={!!(searchQuery || availFilter !== 'all' || filterTags.length > 0)}>
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 pointer-events-none" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                        style={{ background: 'var(--surface-2)' }}>🍽️</div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.name}</span>
                        {!item.is_available && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            Нет в наличии
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {formatPrice(item.base_price)}
                        {item.weight && <span className="ml-2" style={{ color: 'var(--text-muted)' }}>· {item.weight}</span>}
                      </div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                            {TAG_LABELS[tag]?.emoji} {TAG_LABELS[tag]?.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleAvailable(item)} className="btn-ghost p-2" title={item.is_available ? 'Скрыть' : 'Показать'}>
                        {item.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button onClick={() => openEditItem(item)} className="btn-ghost p-2">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="btn-ghost p-2" style={{ color: '#f87171' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </SortableItemRow>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ padding: '1.5rem' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingItem ? 'Редактировать блюдо' : 'Новое блюдо'}</h2>
              <button onClick={() => setShowItemForm(false)} className="btn-ghost p-2">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label mb-1">Название *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="input" placeholder="RU: Маргарита" value={itemForm.name_ru} onChange={e => setItemForm(p => ({ ...p, name_ru: e.target.value }))} />
                  <input className="input" placeholder="UZ: Margarita" value={itemForm.name_uz} onChange={e => setItemForm(p => ({ ...p, name_uz: e.target.value }))} />
                  <input className="input" placeholder="EN: Margherita" value={itemForm.name_en} onChange={e => setItemForm(p => ({ ...p, name_en: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label mb-1">Описание</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <textarea className="input text-sm" rows={2} placeholder="RU: Классическая..." value={itemForm.description_ru} onChange={e => setItemForm(p => ({ ...p, description_ru: e.target.value }))} />
                  <textarea className="input text-sm" rows={2} placeholder="UZ: Klassik..." value={itemForm.description_uz} onChange={e => setItemForm(p => ({ ...p, description_uz: e.target.value }))} />
                  <textarea className="input text-sm" rows={2} placeholder="EN: Classic..." value={itemForm.description_en} onChange={e => setItemForm(p => ({ ...p, description_en: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="label">Цена (сум) *</label>
                  <input className="input" type="number" placeholder="59000" value={itemForm.base_price}
                    onChange={e => setItemForm(p => ({ ...p, base_price: e.target.value }))} />
                </div>
                <div className="flex-1">
                  <label className="label">Вес / Объём</label>
                  <input className="input" placeholder="400г" value={itemForm.weight}
                    onChange={e => setItemForm(p => ({ ...p, weight: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TAG_LABELS) as MenuItemTag[]).map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className="text-xs px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        background: itemForm.tags.includes(tag) ? 'rgba(62,207,142,0.12)' : 'transparent',
                        color: itemForm.tags.includes(tag) ? 'var(--brand)' : 'var(--text-secondary)',
                        borderColor: itemForm.tags.includes(tag) ? 'var(--brand)' : 'var(--border)',
                      }}>
                      {TAG_LABELS[tag].emoji} {TAG_LABELS[tag].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Фото</label>
                {photoPreview && (
                  <img src={photoPreview} alt="preview" className="w-full h-40 object-cover rounded-lg mb-2" />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange}
                  className="text-sm" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Автоматически сожмётся до WebP &lt;200KB
                </p>
              </div>

              {/* Promo section */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input type="checkbox" checked={itemForm.is_promo} onChange={e => setItemForm(p => ({ ...p, is_promo: e.target.checked }))} className="w-4 h-4 rounded text-[var(--brand)]" />
                  <span className="font-semibold text-sm text-[var(--brand)]">Это акция / спецпредложение</span>
                </label>
                
                {itemForm.is_promo && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="label">Ярлык акции</label>
                      <input className="input" placeholder="Напр. 2+1, Хит сезона" value={itemForm.promo_label}
                        onChange={e => setItemForm(p => ({ ...p, promo_label: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Старая цена (для зачёркивания)</label>
                      <input type="number" className="input" placeholder="0" value={itemForm.old_price}
                        onChange={e => setItemForm(p => ({ ...p, old_price: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Акция действует до (опционально)</label>
                      <input type="datetime-local" className="input text-sm" value={itemForm.promo_ends_at}
                        onChange={e => setItemForm(p => ({ ...p, promo_ends_at: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                {/* Variants */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Вариации / Размеры (S, L, XL)</label>
                    <button onClick={addVariant} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)' }}>+ Добавить</button>
                  </div>
                  <div className="space-y-2">
                    {itemForm.variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center bg-white dark:bg-black/20 p-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block opacity-50">Название (S, M, L)</label>
                          <input className="input text-sm w-full py-1.5" placeholder="Напр. Большая" value={v.name}
                            onChange={e => updateVariant(i, 'name', e.target.value)} />
                        </div>
                        <div className="w-28">
                          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block opacity-50">+ Цена</label>
                          <div className="relative">
                            <input className="input pl-2 pr-6 text-sm w-full py-1.5" type="number" placeholder="0" value={v.price_delta}
                              onChange={e => updateVariant(i, 'price_delta', e.target.value)} />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50 pointer-events-none">₸</span>
                          </div>
                        </div>
                        <button onClick={() => removeVariant(i)} className="p-1.5 text-red-500 rounded-md hover:bg-red-500/10 mt-5"><X size={16} /></button>
                      </div>
                    ))}
                    {itemForm.variants.length === 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Нет вариаций. Цена фиксированная.</span>}
                  </div>
                </div>

                {/* Modifiers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Модификаторы / Добавки</label>
                    <button onClick={addModifier} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)' }}>+ Добавить</button>
                  </div>
                  <div className="space-y-2">
                    {itemForm.modifiers.map((m, i) => (
                      <div key={i} className="flex gap-2 items-center bg-white dark:bg-black/20 p-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block opacity-50">Название добавки</label>
                          <input className="input text-sm flex-1 py-1.5 w-full" placeholder="Напр. Доп. сыр" value={m.name}
                            onChange={e => updateModifier(i, 'name', e.target.value)} />
                        </div>
                        <div className="w-28">
                          <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block opacity-50">Цена</label>
                          <div className="relative">
                            <input className="input pl-2 pr-6 text-sm w-full py-1.5" type="number" placeholder="0" value={m.price}
                              onChange={e => updateModifier(i, 'price', e.target.value)} />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs opacity-50 pointer-events-none">₸</span>
                          </div>
                        </div>
                        <button onClick={() => removeModifier(i)} className="p-1.5 text-red-500 rounded-md hover:bg-red-500/10 mt-5"><X size={16} /></button>
                      </div>
                    ))}
                    {itemForm.modifiers.length === 0 && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Нет добавок.</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowItemForm(false)} className="btn-ghost flex-1">Отмена</button>
              <button onClick={saveItem} disabled={saving || !itemForm.name_ru || !itemForm.base_price}
                className="btn-primary flex-1 justify-center">
                {saving ? 'Сохраняем...' : editingItem ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
