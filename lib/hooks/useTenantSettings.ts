'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tenant, TenantGallery } from '@/lib/types'

interface TenantFormData {
  name: string; slug: string; description: string; description_uz: string; description_en: string
  address: string; phone: string; cuisine_type: string; avg_check: number
  has_wifi: boolean; has_delivery: boolean; has_takeaway: boolean
  primary_color: string; accent_color: string; theme: 'dark' | 'light'
  banner_url: string; logo_url: string
  instagram: string; telegram: string; whatsapp: string; two_gis: string
  call_center_phone: string; show_call_button: boolean
  timezone: string; working_hours: Record<string, unknown>
  lat: number | null; lng: number | null
}

export function useTenantSettings() {
  const supabase = createClient()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [gallery, setGallery] = useState<TenantGallery[]>([])
  const [form, setForm] = useState<TenantFormData>({} as TenantFormData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('tenants').select('*').eq('owner_id', user.id).single()
      if (!data) return

      setTenant(data)
      const social = (data.social_links as any) || {}
      setForm({
        name: data.name, slug: data.slug,
        description: data.description ?? '', description_uz: data.description_uz ?? '', description_en: data.description_en ?? '',
        address: data.address ?? '', phone: data.phone ?? '',
        cuisine_type: data.cuisine_type ?? '', avg_check: data.avg_check ?? 0,
        has_wifi: data.has_wifi, has_delivery: data.has_delivery, has_takeaway: data.has_takeaway,
        primary_color: data.primary_color, accent_color: data.accent_color || '#1C1C1C',
        theme: data.theme || 'dark', banner_url: data.banner_url || '', logo_url: data.logo_url || '',
        instagram: social.instagram || '', telegram: social.telegram || '', whatsapp: social.whatsapp || '', two_gis: social.two_gis || '',
        call_center_phone: data.call_center_phone ?? '', show_call_button: data.show_call_button ?? true,
        timezone: data.timezone || 'Asia/Tashkent', working_hours: (data.working_hours as any) || {},
        lat: (data as any).lat ?? null, lng: (data as any).lng ?? null,
      })

      const { data: gData } = await supabase
        .from('tenant_gallery').select('*').eq('tenant_id', data.id).order('sort_order')
      if (gData) setGallery(gData)
    }
    load()
  }, [supabase])

  const patchForm = useCallback((patch: Partial<TenantFormData>) => {
    setForm(p => ({ ...p, ...patch }))
  }, [])

  const handleSave = async () => {
    if (!tenant) return
    setSaving(true)
    setError(null)

    const { error: err } = await supabase.from('tenants').update({
      name: form.name, slug: form.slug,
      description: form.description, description_uz: form.description_uz, description_en: form.description_en,
      address: form.address, phone: form.phone,
      cuisine_type: form.cuisine_type, avg_check: form.avg_check,
      has_wifi: form.has_wifi, has_delivery: form.has_delivery, has_takeaway: form.has_takeaway,
      primary_color: form.primary_color, accent_color: form.accent_color, theme: form.theme,
      banner_url: form.banner_url, logo_url: form.logo_url,
      call_center_phone: form.call_center_phone, show_call_button: form.show_call_button,
      timezone: form.timezone, working_hours: form.working_hours,
      lat: form.lat, lng: form.lng,
      social_links: { instagram: form.instagram, telegram: form.telegram, whatsapp: form.whatsapp, two_gis: form.two_gis },
    } as any).eq('id', tenant.id)

    if (err) {
      setError(err.code === '23505' ? 'Этот slug уже занят' : err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0]
    if (!file || !tenant) return

    const bucket = type === 'banner' ? 'banners' : 'logos'
    const path = `${tenant.id}/${type}.webp`

    const { error: err } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (!err) {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      patchForm({ [type === 'banner' ? 'banner_url' : 'logo_url']: `${publicUrl}?t=${Date.now()}` } as any)
    } else {
      setError(`Ошибка загрузки: ${err.message}`)
    }
  }

  return {
    tenant, form, patchForm, setForm,
    gallery, setGallery,
    saving, saved, error, setError,
    handleSave, handleImageUpload,
  }
}
