'use client'

import { TrendingUp, Leaf, Flame, Sparkles, WheatOff } from 'lucide-react'
import type { MenuItemTag } from '@/lib/types'

const TAG_CONFIG: Record<MenuItemTag, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  hit:          { icon: TrendingUp, label: 'Хит',           color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  vegan:        { icon: Leaf,       label: 'Веган',          color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  },
  vegetarian:   { icon: Leaf,       label: 'Вегетарианское', color: '#86EFAC', bg: 'rgba(134,239,172,0.12)'},
  spicy:        { icon: Flame,      label: 'Острое',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  new:          { icon: Sparkles,   label: 'Новинка',        color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  gluten_free:  { icon: WheatOff,   label: 'Без глютена',    color: '#EAB308', bg: 'rgba(234,179,8,0.12)'  },
}

export function TagBadge({ type }: { type: MenuItemTag }) {
  const config = TAG_CONFIG[type]
  if (!config) return null
  const Icon = config.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <Icon size={11} />
      {config.label}
    </span>
  )
}

export function TagBadgeList({ tags }: { tags: MenuItemTag[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => <TagBadge key={tag} type={tag} />)}
    </div>
  )
}
