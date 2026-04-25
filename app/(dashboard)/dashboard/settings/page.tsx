'use client'

import { useState } from 'react'
import { useTenantSettings } from '@/lib/hooks/useTenantSettings'
import { GalleryManager } from './components/GalleryManager'
import { WorkingHoursManager } from './components/WorkingHoursManager'
import { LocationPicker } from './components/LocationPicker'
import { Store, Palette, Phone, Clock, Camera } from 'lucide-react'

type TabId = 'main' | 'appearance' | 'contacts' | 'hours'

const TABS = [
  { id: 'main' as TabId, label: 'Основное', icon: <Store size={18} /> },
  { id: 'appearance' as TabId, label: 'Внешний вид', icon: <Palette size={18} /> },
  { id: 'contacts' as TabId, label: 'Контакты', icon: <Phone size={18} /> },
  { id: 'hours' as TabId, label: 'Часы работы', icon: <Clock size={18} /> },
]

export default function SettingsPage() {
  const {
    tenant, form, patchForm,
    gallery,
    saving, saved, error,
    handleSave, handleImageUpload,
  } = useTenantSettings()

  const [activeTab, setActiveTab] = useState<TabId>('main')

  if (!tenant) return <div className="p-8" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>

  return (
    <div className="p-4 sm:p-8 max-w-4xl pb-32">
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
          Изменения успешно сохранены
        </div>
      )}

      <div className="flex overflow-x-auto gap-2 mb-6 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id ? 'bg-[var(--brand)] text-black' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}
            `}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="card space-y-6">
        {activeTab === 'main' && <MainTab form={form} patchForm={patchForm} />}
        {activeTab === 'appearance' && <AppearanceTab form={form} patchForm={patchForm} tenantId={tenant.id} gallery={gallery} handleImageUpload={handleImageUpload} />}
        {activeTab === 'contacts' && <ContactsTab form={form} patchForm={patchForm} />}
        {activeTab === 'hours' && <HoursTab form={form} patchForm={patchForm} />}
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

function MainTab({ form, patchForm }: any) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <label className="label">Название заведения</label>
        <input className="input" value={form.name} onChange={e => patchForm({ name: e.target.value })} />
      </div>

      <div>
        <label className="label">URL slug</label>
        <div className="flex items-center">
          <span className="px-3 py-2.5 text-sm rounded-l-lg border border-r-0"
            style={{ color: 'var(--text-muted)', background: 'var(--surface)', borderColor: 'var(--border)' }}>
            /menu/
          </span>
          <input className="input rounded-l-none" value={form.slug}
            onChange={e => patchForm({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
        </div>
      </div>

      <div>
        <label className="label">Описание</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <textarea className="input text-sm" rows={3} value={form.description} placeholder="RU"
            onChange={e => patchForm({ description: e.target.value })} />
          <textarea className="input text-sm" rows={3} value={form.description_uz} placeholder="UZ"
            onChange={e => patchForm({ description_uz: e.target.value })} />
          <textarea className="input text-sm" rows={3} value={form.description_en} placeholder="EN"
            onChange={e => patchForm({ description_en: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Адрес</label>
          <input className="input" placeholder="ул. Навои, 15" value={form.address}
            onChange={e => patchForm({ address: e.target.value })} />
        </div>
        <div>
          <label className="label">Телефон</label>
          <input className="input" placeholder="+998 90 123 45 67" value={form.phone}
            onChange={e => patchForm({ phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Тип кухни</label>
          <input className="input" placeholder="Бургеры, Фастфуд" value={form.cuisine_type}
            onChange={e => patchForm({ cuisine_type: e.target.value })} />
        </div>
        <div>
          <label className="label">Средний чек (сум)</label>
          <input type="number" className="input" value={form.avg_check || ''}
            onChange={e => patchForm({ avg_check: parseInt(e.target.value) || 0 })} />
        </div>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <label className="label mb-3 block">Местоположение на карте</label>
        <LocationPicker lat={form.lat} lng={form.lng}
          onChange={(lat: number, lng: number) => patchForm({ lat, lng })} />
      </div>

      <div className="flex gap-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        {(['has_wifi', 'has_delivery', 'has_takeaway'] as const).map(f => (
          <label key={f} className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form[f]} onChange={e => patchForm({ [f]: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--brand)]" />
            {{ has_wifi: 'Wi-Fi', has_delivery: 'Доставка', has_takeaway: 'Навынос' }[f]}
          </label>
        ))}
      </div>
    </div>
  )
}

function AppearanceTab({ form, patchForm, tenantId, gallery, handleImageUpload }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h3 className="text-sm font-semibold mb-4">Шапка профиля</h3>
        <div className="relative h-48 rounded-xl overflow-hidden border mb-12" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          {form.banner_url ? (
            <img src={form.banner_url} className="w-full h-full object-cover" alt="Banner" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>1200 × 300px</div>
          )}
          <label className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:bg-black/70 backdrop-blur-sm transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'banner')} />
            <span className="flex items-center gap-1"><Camera size={14} /> Изменить баннер</span>
          </label>

          <div className="absolute -bottom-8 left-6">
            <div className="relative w-24 h-24 rounded-2xl border-4 overflow-hidden" style={{ borderColor: 'var(--surface)', background: 'var(--surface-2)' }}>
              {form.logo_url ? (
                <img src={form.logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>Лого</div>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white">
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'logo')} />
                <Camera size={20} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          <label className="label">Основной цвет</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color}
              onChange={e => patchForm({ primary_color: e.target.value })}
              className="w-12 h-10 rounded cursor-pointer" style={{ border: '1px solid var(--border)' }} />
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{form.primary_color}</span>
          </div>
        </div>

        <div>
          <label className="label">Тема меню</label>
          <div className="flex bg-[var(--surface-2)] p-1 rounded-lg">
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => patchForm({ theme: t })}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  form.theme === t
                    ? t === 'dark' ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm' : 'bg-white text-black shadow-sm'
                    : 'text-[var(--text-muted)]'
                }`}>
                {t === 'dark' ? 'Тёмная' : 'Светлая'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <GalleryManager tenantId={tenantId} initialGallery={gallery} />
      </div>
    </div>
  )
}

function ContactsTab({ form, patchForm }: any) {
  const fields = [
    { key: 'call_center_phone', label: 'Телефон колл-центра', placeholder: '78 150 00 30' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/...' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '+998901234567' },
    { key: 'two_gis', label: '2GIS', placeholder: 'https://2gis.uz/...' },
  ] as const

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label className="label">{label}</label>
          <input className="input" placeholder={placeholder} value={form[key]}
            onChange={e => patchForm({ [key]: e.target.value })} />
        </div>
      ))}

      <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm">
        <input type="checkbox" checked={form.show_call_button}
          onChange={e => patchForm({ show_call_button: e.target.checked })}
          className="w-4 h-4 rounded text-[var(--brand)]" />
        Показывать плавающую кнопку звонка на мобильных
      </label>
    </div>
  )
}

function HoursTab({ form, patchForm }: any) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <label className="label">Часовой пояс</label>
        <select className="input" value={form.timezone} onChange={e => patchForm({ timezone: e.target.value })}>
          <option value="Asia/Tashkent">Asia/Tashkent (Узбекистан)</option>
          <option value="Asia/Almaty">Asia/Almaty (Казахстан)</option>
          <option value="Europe/Moscow">Europe/Moscow (Россия)</option>
        </select>
      </div>

      <WorkingHoursManager value={form.working_hours} onChange={val => patchForm({ working_hours: val })} />
    </div>
  )
}
