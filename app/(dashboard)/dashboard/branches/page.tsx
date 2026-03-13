'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Branch } from '@/lib/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, MapPin } from 'lucide-react'

const EMPTY_FORM = {
  name: '', slug: '', address: '', phone: '',
  lat: '', lng: '', is_active: true
}

export default function BranchesPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single()
      if (!tenant) return
      setTenantId(tenant.id)
      fetchBranches(tenant.id)
    }
    load()
  }, [])

  const fetchBranches = async (tid: string) => {
    const { data } = await supabase.from('branches').select('*').eq('tenant_id', tid).order('sort_order')
    setBranches(data ?? [])
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowForm(true)
  }

  const openEdit = (b: Branch) => {
    setEditing(b)
    setForm({
      name: b.name, slug: b.slug, address: b.address,
      phone: b.phone ?? '', lat: b.lat ? String(b.lat) : '',
      lng: b.lng ? String(b.lng) : '', is_active: b.is_active
    })
    setShowForm(true)
  }

  const saveBranch = async () => {
    if (!tenantId || !form.name.trim() || !form.slug.trim() || !form.address.trim()) return
    setSaving(true)

    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      address: form.address.trim(),
      phone: form.phone || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      is_active: form.is_active,
      sort_order: editing ? editing.sort_order : branches.length,
    }

    if (editing) {
      await supabase.from('branches').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('branches').insert(payload)
    }

    setShowForm(false)
    setSaving(false)
    fetchBranches(tenantId)
  }

  const toggleActive = async (b: Branch) => {
    await supabase.from('branches').update({ is_active: !b.is_active }).eq('id', b.id)
    fetchBranches(tenantId!)
  }

  const deleteBranch = async (id: string) => {
    if (!confirm('Удалить филиал? QR-коды привязанные к нему останутся.')) return
    await supabase.from('branches').delete().eq('id', id)
    fetchBranches(tenantId!)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Филиалы</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Управляйте несколькими точками вашего заведения</p>
        </div>
        <button onClick={openNew} className="btn-primary py-2 px-4 flex items-center gap-2">
          <Plus size={16} /> Добавить филиал
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {branches.length === 0 && (
          <div className="text-center py-16 card">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Пока нет ни одного филиала.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Добавьте свои точки, чтобы выдавать разные QR-коды для каждого места.
            </p>
          </div>
        )}

        {branches.map(b => (
          <div key={b.id} className="card p-4 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: b.is_active ? 'rgba(62,207,142,0.12)' : 'rgba(239,68,68,0.1)' }}>
              <MapPin size={22} style={{ color: b.is_active ? 'var(--brand)' : '#f87171' }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-base truncate">{b.name}</strong>
                {!b.is_active && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Скрыт</span>
                )}
              </div>
              <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{b.address}</p>
              {b.phone && <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>{b.phone}</p>}
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Slug: <code className="text-xs">/menu/…/{b.slug}</code></p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(b)} className="btn-ghost p-2" title={b.is_active ? 'Скрыть' : 'Показать'}>
                {b.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button onClick={() => openEdit(b)} className="btn-ghost p-2">
                <Pencil size={18} />
              </button>
              <button onClick={() => deleteBranch(b.id)} className="btn-ghost p-2" style={{ color: '#f87171' }}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing ? 'Редактировать филиал' : 'Новый филиал'}</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Название *</label>
                <input className="input" placeholder="Центральный, Чиланзар, Ташкент-Сити..." value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>

              <div>
                <label className="label">Slug (URL) *</label>
                <div className="flex items-center gap-0">
                  <span className="input rounded-r-none border-r-0 flex-shrink-0 text-sm"
                    style={{ color: 'var(--text-muted)', width: 'auto', padding: '0.625rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}>
                    /menu/…/
                  </span>
                  <input className="input" style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                    placeholder="chilanzar" value={form.slug}
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} />
                </div>
              </div>

              <div>
                <label className="label">Адрес *</label>
                <input className="input" placeholder="ул. Навои, 15, Ташкент" value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>

              <div>
                <label className="label">Телефон</label>
                <input className="input" placeholder="+998 90 123 45 67" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Широта (lat)</label>
                  <input type="number" step="any" className="input" placeholder="41.2995" value={form.lat}
                    onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Долгота (lng)</label>
                  <input type="number" step="any" className="input" placeholder="69.2401" value={form.lng}
                    onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Филиал активен (виден публично)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Отмена</button>
              <button onClick={saveBranch} disabled={saving || !form.name || !form.slug || !form.address}
                className="btn-primary flex-1 justify-center">
                {saving ? 'Сохранение...' : editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
