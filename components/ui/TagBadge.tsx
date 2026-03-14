'use client'

import * as LucideIcons from 'lucide-react'
import type { MenuTag } from '@/lib/types'
import { Lang } from '@/lib/utils/i18n'

export function TagBadge({ tag, lang = 'ru' }: { tag: MenuTag; lang?: Lang }) {
  if (!tag) return null
  
  // Dynamically get the icon from lucide-react
  const IconName = tag.icon || 'HelpCircle'
  const Icon = (LucideIcons as any)[IconName] || LucideIcons.HelpCircle
  
  // Get translated name
  const name = lang === 'uz' ? tag.name_uz : lang === 'en' ? tag.name_en : tag.name_ru
  
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all hover:scale-105"
      style={{ 
        color: tag.color || '#666', 
        backgroundColor: tag.bg_color || 'rgba(0,0,0,0.05)',
        borderColor: tag.color ? `${tag.color}30` : 'rgba(0,0,0,0.1)'
      }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {name || tag.slug}
    </span>
  )
}

export function TagBadgeList({ tags, activeSlugs, lang = 'ru' }: { tags: MenuTag[]; activeSlugs: string[]; lang?: Lang }) {
  if (!activeSlugs || activeSlugs.length === 0 || !tags) return null
  
  const filteredTags = tags.filter(t => activeSlugs.includes(t.slug))
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {filteredTags.map(tag => <TagBadge key={tag.id} tag={tag} lang={lang} />)}
    </div>
  )
}
