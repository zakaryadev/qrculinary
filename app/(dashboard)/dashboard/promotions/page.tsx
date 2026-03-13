'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PromoBanner, Tenant } from '@/lib/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export default function PromotionsPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [banners, setBanners] = useState<PromoBanner[]>([])
  
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    link_url: '',
    is_active: true,
    starts_at: '',
    ends_at: ''
  })
  
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single() as { data: Pick<Tenant, 'id'> | null, error: any }
      if (!tenant) return
      setTenantId(tenant.id)
      fetchBanners(tenant.id)
    }
    load()
  }, [])

  const fetchBanners = async (tid: string) => {
    const { data } = await supabase.from('promo_banners').select('*').eq('tenant_id', tid).order('sort_order')
    setBanners(data ?? [])
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200 })
    setPhotoFile(compressed as File)
    setPhotoPreview(URL.createObjectURL(compressed))
  }

  const openNew = () => {
    setEditingBanner(null)
    setForm({ title: '', link_url: '', is_active: true, starts_at: '', ends_at: '' })
    setPhotoFile(null)
    setPhotoPreview(null)
    setShowForm(true)
  }

  const openEdit = (b: PromoBanner) => {
    setEditingBanner(b)
    setForm({
      title: b.title,
      link_url: b.link_url || '',
      is_active: b.is_active,
      starts_at: b.starts_at ? new Date(b.starts_at).toISOString().slice(0, 16) : '',
      ends_at: b.ends_at ? new Date(b.ends_at).toISOString().slice(0, 16) : ''
    })
    setPhotoPreview(b.image_url)
    setPhotoFile(null)
    setShowForm(true)
  }

  const saveBanner = async () => {
    if (!tenantId || !form.title) return
    setSaving(true)

    let image_url = editingBanner?.image_url ?? null

    if (photoFile) {
      const ext = 'webp'
      const path = `${tenantId}/promo_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('banners').upload(path, photoFile, { upsert: true })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
        image_url = publicUrl
      }
    }

    const payload = {
      tenant_id: tenantId,
      title: form.title,
      link_url: form.link_url || null,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      image_url
    }

    if (editingBanner) {
      await supabase.from('promo_banners').update(payload).eq('id', editingBanner.id)
    } else {
      await supabase.from('promo_banners').insert({ ...payload, sort_order: banners.length })
    }

    setShowForm(false)
    setSaving(false)
    fetchBanners(tenantId)
  }

  const toggleActive = async (b: PromoBanner) => {
    await supabase.from('promo_banners').update({ is_active: !b.is_active }).eq('id', b.id)
    fetchBanners(tenantId!)
  }

  const deleteBanner = async (id: string) => {
    if (!confirm('Удалить баннер?')) return
    await supabase.from('promo_banners').delete().eq('id', id)
    fetchBanners(tenantId!)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Акции и Спецпредложения</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Баннеры на главной странице меню</p>
        </div>
        <button onClick={openNew} className="btn-primary py-2 px-4 shadow-sm flex items-center gap-2">
          <Plus size={16} /> Добавить баннер
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {banners.length === 0 && (
          <div className="text-center py-16 card">
            <div className="text-4xl mb-3">🏷️</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Пока нет ни одного баннера.</p>
          </div>
        )}

        {banners.map(b => (
          <div key={b.id} className="card p-4 flex gap-4 items-center">
            {b.image_url ? (
              <img src={b.image_url} alt={b.title} className="w-32 h-20 object-cover rounded-lg flex-shrink-0 border" style={{ borderColor: 'var(--border)' }} />
            ) : (
              <div className="w-32 h-20 rounded-lg flex items-center justify-center bg-[var(--surface-2)] flex-shrink-0">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Нет фото</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-lg truncate">{b.title}</strong>
                {!b.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Скрыт</span>
                )}
              </div>
              {b.link_url && <p className="text-sm truncate" style={{ color: 'var(--brand)' }}>Связанная ссылка: {b.link_url}</p>}
              {(b.starts_at || b.ends_at) && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  С {b.starts_at ? new Date(b.starts_at).toLocaleDateString() : '...'} по {b.ends_at ? new Date(b.ends_at).toLocaleDateString() : '...'}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(b)} className="btn-ghost p-2" title={b.is_active ? 'Скрыть' : 'Показать'}>
                {b.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button onClick={() => openEdit(b)} className="btn-ghost p-2">
                <Pencil size={18} />
              </button>
              <button onClick={() => deleteBanner(b.id)} className="btn-ghost p-2" style={{ color: '#f87171' }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingBanner ? 'Редактировать баннер' : 'Новый баннер'}</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2 hover:bg-[var(--surface-2)] rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Название (для вас)</label>
                <input className="input" placeholder="Напр. Акция 2+1 Август" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div>
                <label className="label">Изображение (рекомендуется 1200x400)</label>
                {photoPreview && (
                  <img src={photoPreview} alt="preview" className="w-full h-32 object-cover rounded-lg mb-2 border" style={{ borderColor: 'var(--border)' }} />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm w-full" style={{ color: 'var(--text-secondary)' }} />
              </div>

              <div>
                <label className="label">Ссылка при клике (опционально)</label>
                <input className="input" placeholder="Напр. /menu/brand/category" value={form.link_url}
                  onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Начало</label>
                  <input type="datetime-local" className="input text-sm" value={form.starts_at}
                    onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Окончание</label>
                  <input type="datetime-local" className="input text-sm" value={form.ends_at}
                    onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Отмена</button>
              <button onClick={saveBanner} disabled={saving || !form.title} className="btn-primary flex-1 justify-center">
                {saving ? 'Сохранение...' : editingBanner ? 'Сохранить изменения' : 'Создать баннер'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
