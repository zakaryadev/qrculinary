'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MenuTag } from '@/lib/types'
import * as Icons from 'lucide-react'
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, Check } from 'lucide-react'
import Link from 'next/link'

const AVAILABLE_ICONS = [
  'Leaf', 'Flame', 'TrendingUp', 'Sparkles', 'WheatOff', 'Apple', 'Beef', 'Milk', 'Nut', 'IceCream',
  'Heart', 'Zap', 'Clock', 'BadgePercent', 'PartyPopper', 'Utensils', 'Coffee', 'GlassWater', 'Beer',
  'Fish', 'Carrot', 'Egg', 'Cookie', 'Cake', 'Pizza', 'Soup', 'Smile', 'Star'
]

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const rgbaToHex = (rgba: string) => {
  if (!rgba.startsWith('rgba')) return rgba
  const parts = rgba.match(/[\d.]+/g)
  if (!parts || parts.length < 3) return '#ffffff'
  const r = parseInt(parts[0]).toString(16).padStart(2, '0')
  const g = parseInt(parts[1]).toString(16).padStart(2, '0')
  const b = parseInt(parts[2]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

const getAlpha = (rgba: string) => {
  if (!rgba.startsWith('rgba')) return 1
  const parts = rgba.match(/[\d.]+/g)
  return parts && parts[4] ? parseFloat(parts[4]) : parts && parts[3] ? parseFloat(parts[3]) : 1
}

export default function TagsPage() {
  const supabase = createClient()
  const [tags, setTags] = useState<MenuTag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    slug: '',
    name_ru: '',
    name_uz: '',
    name_en: '',
    icon: 'Leaf',
    color: '#3ecf8e',
    bg_color: 'rgba(62,207,142,0.1)'
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    setLoading(true)
    const { data } = await supabase.from('menu_tags').select('*').order('slug')
    setTags(data ?? [])
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.slug || !form.name_ru) return
    setSaving(true)
    try {
      if (editingId) {
        await supabase.from('menu_tags').update(form).eq('id', editingId)
      } else {
        await supabase.from('menu_tags').insert(form)
      }
      await fetchTags()
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены? Это действие нельзя отменить.')) return
    await supabase.from('menu_tags').delete().eq('id', id)
    fetchTags()
  }

  const openEdit = (tag: MenuTag) => {
    setEditingId(tag.id)
    setForm({
      slug: tag.slug,
      name_ru: tag.name_ru,
      name_uz: tag.name_uz || '',
      name_en: tag.name_en || '',
      icon: tag.icon || 'Leaf',
      color: tag.color || '#666666',
      bg_color: tag.bg_color || 'rgba(0,0,0,0.05)'
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ slug: '', name_ru: '', name_uz: '', name_en: '', icon: 'Leaf', color: '#3ecf8e', bg_color: 'rgba(62,207,142,0.1)' })
    setShowIconPicker(false)
  }

  const filteredTags = tags.filter(t => 
    t.name_ru.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Icons.Tags className="text-[var(--brand)]" />
            Управление тегами
          </h1>
          <p className="text-sm opacity-50 mt-1">Настройка тегов для блюд (Хит, Острое, Веган и т.д.)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary w-full sm:w-auto">
          <Plus size={18} />
          Добавить тег
        </button>
      </div>

      <div className="mb-6 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
        <input 
          className="input pl-10" 
          placeholder="Поиск по названию или slug..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse bg-white/5 border border-white/10" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map(tag => {
            const TagIcon = (Icons as any)[tag.icon || 'Leaf'] || Icons.Leaf
            return (
              <div key={tag.id} className="card group hover:scale-[1.02] transition-all p-4 border flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" 
                      style={{ background: tag.bg_color || 'rgba(0,0,0,0.05)', color: tag.color || 'inherit' }}>
                      <TagIcon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate">{tag.name_ru}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest opacity-30">{tag.slug}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(tag)} className="p-1.5 hover:bg-black/5 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(tag.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tag.name_uz && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 opacity-60">UZ: {tag.name_uz}</span>}
                  {tag.name_en && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 opacity-60">EN: {tag.name_en}</span>}
                </div>
              </div>
            )
          })}
          {filteredTags.length === 0 && (
            <div className="col-span-full py-12 text-center opacity-40">
              Теги не найдены
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md flex flex-col p-0 overflow-hidden animate-in zoom-in-95 duration-200" style={{ background: 'var(--surface)' }}>
            <div className="py-3.5 px-5 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? 'Редактировать тег' : 'Новый тег'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X size={22} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 pb-4 sm:pb-0">
                  <label className="label">Slug (уникальный ID)</label>
                  <input 
                    className="input" 
                    value={form.slug} 
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} 
                    placeholder="напр: vegan"
                    disabled={!!editingId}
                  />
                  <p className="text-[10px] opacity-40 mt-1">Только латиница, цифры и _</p>
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Иконка</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="input flex items-center justify-between hover:border-[var(--brand)] transition-all pr-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/5" style={{ color: form.color }}>
                          {(() => {
                            const Icon = (Icons as any)[form.icon] || Icons.HelpCircle
                            return <Icon size={20} strokeWidth={2.5} />
                          })()}
                        </div>
                        <span className="text-sm font-medium">{form.icon}</span>
                      </div>
                      <Icons.ChevronDown size={16} className={`transition-transform duration-200 ${showIconPicker ? 'rotate-180' : ''}`} />
                    </button>

                    {showIconPicker && (
                      <>
                        <div 
                          className="fixed inset-0 z-[60]" 
                          onClick={() => setShowIconPicker(false)}
                        />
                        <div className="absolute top-[calc(100%+8px)] left-0 sm:-left-32 sm:right-auto w-full sm:w-[340px] z-[70] p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top sm:origin-top-right" 
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Выберите иконку</span>
                            <button onClick={() => setShowIconPicker(false)} className="opacity-40 hover:opacity-100"><Icons.X size={14} /></button>
                          </div>
                          <div className="grid grid-cols-6 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {AVAILABLE_ICONS.map(iconName => {
                              const Icon = (Icons as any)[iconName] || Icons.HelpCircle
                              const isSelected = form.icon === iconName
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => {
                                    setForm(p => ({ ...p, icon: iconName }))
                                    setShowIconPicker(false)
                                  }}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                                    isSelected 
                                      ? 'bg-[var(--brand)] text-black border-[var(--brand)] shadow-lg scale-110 z-10' 
                                      : 'hover:bg-black/5 dark:hover:bg-white/5 border-transparent opacity-60 hover:opacity-100 hover:scale-110'
                                  }`}
                                  title={iconName}
                                >
                                  <Icon size={20} />
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="label">Название (RU) *</label>
                  <input className="input" value={form.name_ru} onChange={e => setForm(p => ({ ...p, name_ru: e.target.value }))} placeholder="Веган" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Название (UZ)</label>
                    <input className="input" value={form.name_uz} onChange={e => setForm(p => ({ ...p, name_uz: e.target.value }))} placeholder="Vegan" />
                  </div>
                  <div>
                    <label className="label">Название (EN)</label>
                    <input className="input" value={form.name_en} onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))} placeholder="Vegan" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 border-b sm:border-b-0 pb-4 sm:pb-0">
                  <label className="label">Цвет текста</label>
                  <div className="flex gap-2">
                    <input className="input h-9 w-12 p-1 flex-shrink-0" type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                    {/* <input className="input flex-1 text-xs" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="#HEX" /> */}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="label">Фон и Прозрачность</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input 
                        className="input h-9 w-12 p-1 flex-shrink-0" 
                        type="color" 
                        value={rgbaToHex(form.bg_color)} 
                        onChange={e => setForm(p => ({ ...p, bg_color: hexToRgba(e.target.value, getAlpha(p.bg_color)) }))} 
                      />
                      {/* <input 
                        className="input flex-1 text-xs" 
                        value={form.bg_color} 
                        onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))} 
                        placeholder="rgba..." 
                      /> */}
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <Icons.Sun size={12} className="opacity-40" />
                      <input 
                        type="range" min="0" max="1" step="0.01" 
                        className="flex-1 h-1.5 accent-[var(--brand)] bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer"
                        value={getAlpha(form.bg_color)}
                        onChange={e => setForm(p => ({ ...p, bg_color: hexToRgba(rgbaToHex(p.bg_color), parseFloat(e.target.value)) }))}
                      />
                      <span className="text-[10px] font-mono min-w-[25px] opacity-60">{Math.round(getAlpha(form.bg_color) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-black/5 dark:bg-white/5 flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Предпросмотр</span>
                {(() => {
                  const TagIcon = (Icons as any)[form.icon || 'Leaf'] || Icons.Leaf
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-sm"
                      style={{ color: form.color, backgroundColor: form.bg_color, borderColor: `${form.color}40` }}>
                      <TagIcon size={14} strokeWidth={3} />
                      {form.name_ru || 'Пример тега'}
                    </span>
                  )
                })()}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button onClick={closeForm} className="btn-ghost flex-1">Отмена</button>
                <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={saving || !form.slug || !form.name_ru}>
                  {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
