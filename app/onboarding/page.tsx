'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAppUrl } from '@/lib/app-url'
import { slugify } from '@/lib/utils'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(slugify(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ owner_id: user.id, name, slug, address: address || null, phone: phone || null })
      .select()
      .single()

    if (tenantError) {
      if (tenantError.code === '23505') setError('URL уже занят — выберите другой slug')
      else setError(tenantError.message)
      setLoading(false)
      return
    }

    // Create default main QR
    const appUrl = getAppUrl()
    await supabase.from('qr_codes').insert({
      tenant_id: tenant.id,
      label: 'Главный',
      url: `${appUrl}/menu/${slug}`,
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>QRCulinary</span>
          <h1 className="text-3xl font-bold mt-4 mb-2">Создайте своё заведение</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Это займёт меньше минуты
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="label">Название заведения *</label>
              <input
                className="input"
                placeholder="Mama Roma, Coffee House..."
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">URL вашего меню *</label>
              <div className="flex items-center gap-0">
                <span className="input rounded-r-none border-r-0 flex-shrink-0 text-muted"
                  style={{ color: 'var(--text-muted)', width: 'auto', padding: '0.625rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  qrculinary.com/menu/
                </span>
                <input
                  className="input"
                  style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  placeholder="mama-roma"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Только латинские буквы, цифры и дефис
              </p>
            </div>

            <div>
              <label className="label">Адрес</label>
              <input
                className="input"
                placeholder="ул. Навои, 15"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Телефон</label>
              <input
                className="input"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? 'Создаём...' : 'Создать заведение →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
