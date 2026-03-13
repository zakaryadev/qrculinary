'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TenantGallery } from '@/lib/types'
import { Trash2, GripVertical, Plus } from 'lucide-react'

export function GalleryManager({ tenantId, initialGallery }: { tenantId: string; initialGallery: TenantGallery[] }) {
  const supabase = createClient()
  const [gallery, setGallery] = useState<TenantGallery[]>(initialGallery)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop() || 'png'
      const photoId = crypto.randomUUID()
      const path = `${tenantId}/${photoId}.${ext}`

      const { error } = await supabase.storage.from('gallery').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path)
        
        const newPhoto = { tenant_id: tenantId, photo_url: publicUrl, sort_order: gallery.length }
        const { data } = await supabase.from('tenant_gallery').insert(newPhoto).select().single()
        if (data) {
          setGallery(prev => [...prev, data])
        }
      }
    }
    setUploading(false)
    e.target.value = '' // Reset
  }

  const handleDelete = async (id: string, url: string) => {
    // Extract path from public URL
    const pathMatch = url.match(/gallery\/(.+)$/)
    if (pathMatch) {
      await supabase.storage.from('gallery').remove([pathMatch[1]])
    }
    await supabase.from('tenant_gallery').delete().eq('id', id)
    setGallery(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Галерея ({gallery.length}/8)</h3>
        <label className="btn-secondary text-sm px-3 py-1.5 cursor-pointer">
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? 'Загрузка...' : <><Plus size={16} className="mr-1"/> Добавить фото</>}
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {gallery.map((photo) => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-square border" style={{ borderColor: 'var(--border)' }}>
            <img src={photo.photo_url} className="w-full h-full object-cover" alt="Gallery" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button onClick={() => handleDelete(photo.id, photo.photo_url)} className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {gallery.length === 0 && !uploading && (
          <div className="col-span-full py-8 text-center text-sm border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            Нет загруженных фотографий
          </div>
        )}
      </div>
    </div>
  )
}
