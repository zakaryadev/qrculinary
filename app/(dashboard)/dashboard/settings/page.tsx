'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tenant, TenantGallery } from '@/lib/types'
import { GalleryManager } from './components/GalleryManager'
import { WorkingHoursManager } from './components/WorkingHoursManager'
import { LocationPicker } from './components/LocationPicker'
import { Camera, Store, Palette, Phone, Clock } from 'lucide-react'

type TabId = 'main' | 'appearance' | 'contacts' | 'hours'

export default function SettingsPage() {
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [gallery, setGallery] = useState<TenantGallery[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('main')
  
  const [form, setForm] = useState({
    name: '', slug: '', description: '', description_uz: '', description_en: '', address: '', phone: '',
    cuisine_type: '', avg_check: 0, has_wifi: false, has_delivery: false, has_takeaway: false,
    primary_color: '#3ECF8E', accent_color: '#1C1C1C', theme: 'dark' as 'dark' | 'light',
    banner_url: '', logo_url: '',
    instagram: '', telegram: '', whatsapp: '', two_gis: '',
    call_center_phone: '', show_call_button: true,
    timezone: 'Asia/Tashkent', working_hours: {},
    lat: null as number | null,
    lng: null as number | null,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase.from('tenants').select('*').eq('owner_id', user.id).single()
      if (data) {
        setTenant(data)
        const social = (data.social_links as any) || {}
        setForm({
          name: data.name,
          slug: data.slug,
          description: data.description ?? '',
          description_uz: data.description_uz ?? '',
          description_en: data.description_en ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          cuisine_type: data.cuisine_type ?? '',
          avg_check: data.avg_check ?? 0,
          has_wifi: data.has_wifi ?? false,
          has_delivery: data.has_delivery ?? false,
          has_takeaway: data.has_takeaway ?? false,
          primary_color: data.primary_color,
          accent_color: data.accent_color || '#1C1C1C',
          theme: data.theme || 'dark',
          banner_url: data.banner_url || '',
          logo_url: data.logo_url || '',
          instagram: social.instagram || '',
          telegram: social.telegram || '',
          whatsapp: social.whatsapp || '',
          two_gis: social.two_gis || '',
          call_center_phone: data.call_center_phone ?? '',
          show_call_button: data.show_call_button ?? true,
          timezone: data.timezone || 'Asia/Tashkent',
          working_hours: (data.working_hours as any) || {},
          lat: (data as any).lat ?? null,
          lng: (data as any).lng ?? null,
        })

        const { data: gData } = await supabase.from('tenant_gallery').select('*').eq('tenant_id', data.id).order('sort_order')
        if (gData) setGallery(gData)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true)
    setError(null)

    const updateData = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      description_uz: form.description_uz,
      description_en: form.description_en,
      address: form.address,
      phone: form.phone,
      cuisine_type: form.cuisine_type,
      avg_check: form.avg_check,
      has_wifi: form.has_wifi,
      has_delivery: form.has_delivery,
      has_takeaway: form.has_takeaway,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      theme: form.theme,
      banner_url: form.banner_url,
      logo_url: form.logo_url,
      call_center_phone: form.call_center_phone,
      show_call_button: form.show_call_button,
      timezone: form.timezone,
      working_hours: form.working_hours,
      lat: form.lat,
      lng: form.lng,
      social_links: {
        instagram: form.instagram,
        telegram: form.telegram,
        whatsapp: form.whatsapp,
        two_gis: form.two_gis
      }
    }

    const { error } = await supabase.from('tenants').update(updateData).eq('id', tenant.id)
    if (error) {
      if (error.code === '23505') setError('Этот slug уже занят')
      else setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0]
    if (!file || !tenant) return
    
    if (type === 'banner') setUploadingBanner(true)
    else setUploadingLogo(true)

    const bucket = type === 'banner' ? 'banners' : 'logos'
    const path = `${tenant.id}/${type}.webp`

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      // Force cache bust
      const finalUrl = `${publicUrl}?t=${Date.now()}`
      setForm(p => ({ ...p, [type === 'banner' ? 'banner_url' : 'logo_url']: finalUrl }))
    } else {
      setError(`Ошибка загрузки: ${error.message}`)
    }

    if (type === 'banner') setUploadingBanner(false)
    else setUploadingLogo(false)
  }

  if (!tenant) return <div className="p-8" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>

  const TABS = [
    { id: 'main', label: 'Основное', icon: <Store size={18} /> },
    { id: 'appearance', label: 'Внешний вид', icon: <Palette size={18} /> },
    { id: 'contacts', label: 'Контакты', icon: <Phone size={18} /> },
    { id: 'hours', label: 'Часы работы', icon: <Clock size={18} /> },
  ] as const

  return (
    <div className="p-4 sm:p-8 max-w-4xl max-w-full pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Настройки заведения</h1>
        <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-6">
          {saving ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
          {error}
        </div>
      )}
      {saved && (
        <div className="p-3 mb-6 rounded-lg text-sm" style={{ background: 'rgba(62,207,142,0.1)', color: 'var(--brand)' }}>
          ✅ Изменения успешно сохранены
        </div>
      )}

      {/* Tabs list */}
      <div className="flex overflow-x-auto gap-2 mb-6 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id ? 'bg-[var(--brand)] text-black' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}
            `}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="card space-y-6">
        
        {/* --- MAIN TAB --- */}
        {activeTab === 'main' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="label">Название заведения</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div>
              <label className="label">URL slug</label>
              <div className="flex items-center gap-0">
                <span className="input rounded-r-none border-r-0 flex-shrink-0"
                  style={{ color: 'var(--text-muted)', width: 'auto', padding: '0.625rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', fontSize: '0.875rem' }}>
                  /menu/
                </span>
                <input className="input" style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                  value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              </div>
            </div>

            <div>
              <label className="label">Описание</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <textarea className="input text-sm" rows={3} value={form.description} placeholder="RU: Коротко о главном..."
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                <textarea className="input text-sm" rows={3} value={form.description_uz} placeholder="UZ: Qisqacha..."
                  onChange={e => setForm(p => ({ ...p, description_uz: e.target.value }))} />
                <textarea className="input text-sm" rows={3} value={form.description_en} placeholder="EN: Short description..."
                  onChange={e => setForm(p => ({ ...p, description_en: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Адрес (название)</label>
                <input className="input" placeholder="ул. Навои, 15" value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">Телефон</label>
                <input className="input" placeholder="+998 90 123 45 67" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Тип кухни (через запятую)</label>
                <input className="input" placeholder="Бургеры, Фастфуд" value={form.cuisine_type}
                  onChange={e => setForm(p => ({ ...p, cuisine_type: e.target.value }))} />
              </div>
              <div>
                <label className="label">Средний чек (сум)</label>
                <input type="number" className="input" placeholder="45000" value={form.avg_check || ''}
                  onChange={e => setForm(p => ({ ...p, avg_check: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* Location Map Picker */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="label mb-3 block">Местоположение на карте</label>
              <LocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) => setForm(p => ({ ...p, lat, lng }))}
              />
            </div>

            <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.has_wifi} onChange={e => setForm(p => ({ ...p, has_wifi: e.target.checked }))} className="w-4 h-4 rounded text-[var(--brand)]" />
                <span className="text-sm">Wi-Fi</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.has_delivery} onChange={e => setForm(p => ({ ...p, has_delivery: e.target.checked }))} className="w-4 h-4 rounded text-[var(--brand)]" />
                <span className="text-sm">Доставка</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.has_takeaway} onChange={e => setForm(p => ({ ...p, has_takeaway: e.target.checked }))} className="w-4 h-4 rounded text-[var(--brand)]" />
                <span className="text-sm">Навынос</span>
              </label>
            </div>
          </div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeTab === 'appearance' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Banner & Logo */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Шапка профиля</h3>
              <div className="relative h-48 rounded-xl overflow-hidden border mb-12" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                {form.banner_url ? (
                  <img src={form.banner_url} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>1200 × 300px</div>
                )}
                <label className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-black/70 backdrop-blur-sm transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'banner')} disabled={uploadingBanner} />
                  {uploadingBanner ? 'Загрузка...' : <span className="flex items-center gap-1"><Camera size={14}/> Изменить баннер</span>}
                </label>

                <div className="absolute -bottom-8 left-6">
                  <div className="relative w-24 h-24 rounded-2xl border-4 overflow-hidden" style={{ borderColor: 'var(--surface)', background: 'var(--surface-2)' }}>
                    {form.logo_url ? (
                      <img src={form.logo_url} className="w-full h-full object-cover" alt="Logo" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-center p-2" style={{ color: 'var(--text-muted)' }}>Лого</div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} disabled={uploadingLogo} />
                      <Camera size={20} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Colors & Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <label className="label">Основной цвет</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color}
                    onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                    className="w-12 h-10 rounded cursor-pointer" style={{ border: '1px solid var(--border)' }} />
                  <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{form.primary_color}</span>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Цвет кнопок, активных тегов и акцентов.</p>
              </div>

              <div>
                <label className="label">Тема меню</label>
                <div className="flex bg-[var(--surface-2)] p-1 rounded-lg">
                  <button onClick={() => setForm(p => ({ ...p, theme: 'dark' }))}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${form.theme === 'dark' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
                    Тёмная
                  </button>
                  <button onClick={() => setForm(p => ({ ...p, theme: 'light' }))}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${form.theme === 'light' ? 'bg-[#ffffff] text-black shadow-sm' : 'text-[var(--text-muted)]'}`}>
                    Светлая
                  </button>
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <GalleryManager tenantId={tenant.id} initialGallery={gallery} />
            </div>

          </div>
        )}

        {/* --- CONTACTS TAB --- */}
        {activeTab === 'contacts' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="label">Телефон колл-центра</label>
              <input className="input" placeholder="78 150 00 30" value={form.call_center_phone}
                onChange={e => setForm(p => ({ ...p, call_center_phone: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Будет отображаться в меню для быстрой связи.</p>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={form.show_call_button} 
                  onChange={e => setForm(p => ({ ...p, show_call_button: e.target.checked }))} 
                  className="w-4 h-4 rounded text-[var(--brand)]" />
                <span className="text-sm">Показывать плавающую кнопку звонка на мобильных</span>
              </label>
            </div>
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}></div>

             <div>
              <label className="label">Instagram (ссылка или @username)</label>
              <input className="input" placeholder="https://instagram.com/bamburger" value={form.instagram}
                onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telegram (ссылка или @username)</label>
              <input className="input" placeholder="https://t.me/bamburger" value={form.telegram}
                onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))} />
            </div>
            <div>
              <label className="label">WhatsApp (номер с кодом)</label>
              <input className="input" placeholder="+998901234567" value={form.whatsapp}
                onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Укажите номер телефона, он превратится в ссылку для WhatsApp.</p>
            </div>
            <div>
              <label className="label">Ссылка на 2GIS</label>
              <input className="input" placeholder="https://2gis.uz/..." value={form.two_gis}
                onChange={e => setForm(p => ({ ...p, two_gis: e.target.value }))} />
            </div>
          </div>
        )}

        {/* --- WORKING HOURS TAB --- */}
        {activeTab === 'hours' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <label className="label">Часовой пояс</label>
              <select className="input" value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Tashkent">Asia/Tashkent (Узбекистан)</option>
                <option value="Asia/Almaty">Asia/Almaty (Казахстан)</option>
                <option value="Europe/Moscow">Europe/Moscow (Россия)</option>
              </select>
            </div>

            <WorkingHoursManager value={form.working_hours} onChange={val => setForm(p => ({ ...p, working_hours: val }))} />
          </div>
        )}

      </div>
    </div>
  )
}
