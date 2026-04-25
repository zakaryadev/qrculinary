'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCode, Branch } from '@/lib/types'
import { downloadQRPNG, generateQRDataURL } from '@/lib/qr/generate'
import { getAppUrl } from '@/lib/app-url'
import { Plus, Download, Trash2, QrCode, Printer } from 'lucide-react'

export default function QRPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantLogo, setTenantLogo] = useState<string | null>(null)
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [branchId, setBranchId] = useState('')
  const [saving, setSaving] = useState(false)

  const appUrl = getAppUrl()

  // Compute preview URL based on form state
  const selectedBranch = branches.find(b => b.id === branchId)
  const previewUrl = selectedBranch
    ? tableNumber
      ? `${appUrl}/menu/${tenantSlug}/${selectedBranch.slug}?table=${tableNumber}`
      : `${appUrl}/menu/${tenantSlug}/${selectedBranch.slug}`
    : tableNumber
      ? `${appUrl}/menu/${tenantSlug}?table=${tableNumber}`
      : `${appUrl}/menu/${tenantSlug}`

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id,slug,logo_url').eq('owner_id', user.id).single()
      if (!tenant) return
      setTenantId(tenant.id)
      setTenantSlug(tenant.slug)
      setTenantLogo(tenant.logo_url)
      fetchQRCodes(tenant.id, tenant.logo_url)
      fetchBranches(tenant.id)
    }
    load()
  }, [])

  const fetchQRCodes = async (tid: string, logo: string | null = tenantLogo) => {
    const { data } = await supabase.from('qr_codes').select('*').eq('tenant_id', tid).order('created_at')
    setQrCodes(data ?? [])

    // Generate QR previews
    const pvs: Record<string, string> = {}
    for (const qr of data ?? []) {
      pvs[qr.id] = await generateQRDataURL(qr.url, logo)
    }
    setPreviews(pvs)
  }

  const fetchBranches = async (tid: string) => {
    const { data } = await supabase.from('branches').select('*').eq('tenant_id', tid).eq('is_active', true).order('sort_order')
    setBranches(data ?? [])
  }

  const createQR = async () => {
    if (!tenantId || !label.trim()) return
    setSaving(true)

    await supabase.from('qr_codes').insert({
      tenant_id: tenantId,
      label: label.trim(),
      table_number: tableNumber || null,
      branch_id: branchId || null,
      url: previewUrl,
    })

    setLabel('')
    setTableNumber('')
    setBranchId('')
    setShowForm(false)
    setSaving(false)
    fetchQRCodes(tenantId)
  }

  const deleteQR = async (id: string) => {
    if (!confirm('Удалить QR-код?')) return
    await supabase.from('qr_codes').delete().eq('id', id)
    fetchQRCodes(tenantId!)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">QR-коды</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Создавайте отдельные коды для каждого стола или филиала
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> Добавить QR
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Новый QR-код</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Название *</label>
              <input className="input" placeholder="Стол 1, Терраса, Барная стойка..." value={label}
                onChange={e => setLabel(e.target.value)} />
            </div>
            <div>
              <label className="label">Номер стола (опционально)</label>
              <input className="input" placeholder="1" value={tableNumber}
                onChange={e => setTableNumber(e.target.value)} />
            </div>
          </div>

          {/* Branch selector — only shown when branches exist */}
          {branches.length > 0 && (
            <div className="mb-4">
              <label className="label">Филиал (опционально)</label>
              <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
                <option value="">— Без филиала (общее меню) —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            URL: {previewUrl}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
            <button onClick={createQR} disabled={saving || !label} className="btn-primary">
              {saving ? 'Создаём...' : 'Создать QR'}
            </button>
          </div>
        </div>
      )}

      {/* QR cards */}
      {qrCodes.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <QrCode size={48} className="mx-auto mb-4 opacity-30" />
          <p>Нет QR-кодов. Создайте первый!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {qrCodes.map(qr => (
            <div key={qr.id} className="card text-center">
              {previews[qr.id] ? (
                <img src={previews[qr.id]} alt={qr.label}
                  className="w-40 h-40 mx-auto rounded-lg mb-4" />
              ) : (
                <div className="w-40 h-40 mx-auto rounded-lg mb-4 flex items-center justify-center"
                  style={{ background: 'var(--surface-2)' }}>
                  <QrCode size={48} style={{ color: 'var(--text-muted)' }} />
                </div>
              )}

              <div className="font-semibold mb-1">{qr.label}</div>
              {qr.table_number && (
                <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Стол #{qr.table_number}</div>
              )}
              {qr.branch_id && (
                <div className="text-xs mb-1" style={{ color: 'var(--brand)' }}>
                  📍 {branches.find(b => b.id === qr.branch_id)?.name ?? 'Филиал'}
                </div>
              )}
              <div className="text-xs mb-3 truncate px-2" style={{ color: 'var(--text-muted)' }}>{qr.url}</div>
              <div className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Сканирований: <strong style={{ color: 'var(--text-primary)' }}>{qr.scan_count}</strong>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.open(`/qr-print/${qr.id}`, '_blank')}
                  className="btn-primary text-xs py-1.5 px-3"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                  <Printer size={14} /> PDF
                </button>
                <button
                  onClick={() => downloadQRPNG(qr.url, qr.label, tenantLogo)}
                  className="btn-primary text-xs py-1.5 px-3">
                  <Download size={14} /> PNG
                </button>
                <button onClick={() => deleteQR(qr.id)} className="btn-ghost text-xs py-1.5 px-3"
                  style={{ color: '#f87171' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
