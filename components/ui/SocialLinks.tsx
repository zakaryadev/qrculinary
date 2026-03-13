'use client'

import { SiInstagram, SiTelegram, SiWhatsapp } from 'react-icons/si'
import { Globe } from 'lucide-react'

const SOCIAL_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: SiInstagram, color: '#E1306C', label: 'Instagram' },
  telegram:  { icon: SiTelegram,  color: '#2AABEE', label: 'Telegram'  },
  whatsapp:  { icon: SiWhatsapp,  color: '#25D366', label: 'WhatsApp'  },
}

interface Props {
  type: string
  url: string
  borderColor?: string
  background?: string
  textColor?: string
}

export function SocialButton({ type, url, borderColor = 'transparent', background = 'transparent', textColor }: Props) {
  const config = SOCIAL_CONFIG[type]
  if (!config || !url) return null
  const Icon = config.icon
  const toTelegramHref = (v: string) => {
    // Accept only actual t.me links; everything else treat as a username
    if (/^https?:\/\/(www\.)?t\.me\//i.test(v)) return v
    // Strip any URL prefix and @ to get the raw username
    const username = v.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^@/, '').trim()
    return username ? `https://t.me/${username}` : ''
  }

  const href = type === 'instagram'
    ? (url.startsWith('http') ? url : `https://instagram.com/${url.replace('@', '')}`)
    : type === 'telegram'
    ? toTelegramHref(url)
    : type === 'whatsapp'
    ? (url.startsWith('http') ? url : `https://wa.me/${url.replace(/\D/g, '')}`)
    : url

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 border"
      style={{ background, borderColor, color: textColor || config.color }}
    >
      <Icon size={16} style={{ color: config.color, flexShrink: 0 }} />
      {config.label}
    </a>
  )
}

export function SocialLinks({
  socialLinks,
  borderColor,
  background,
  textColor,
}: {
  socialLinks: Record<string, string>
  borderColor?: string
  background?: string
  textColor?: string
}) {
  const keys = ['instagram', 'telegram', 'whatsapp']
  const links = keys.filter(k => socialLinks[k])

  // Also handle two_gis / website as a generic link
  const extras: { href: string; label: string }[] = []
  if (socialLinks.two_gis) extras.push({ href: socialLinks.two_gis, label: '2GIS' })
  if (socialLinks.website) extras.push({ href: socialLinks.website, label: 'Сайт' })

  if (links.length === 0 && extras.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(k => (
        <SocialButton key={k} type={k} url={socialLinks[k]} borderColor={borderColor} background={background} textColor={textColor} />
      ))}
      {extras.map(e => (
        <a
          key={e.href}
          href={e.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 border"
          style={{ background: background || 'transparent', borderColor: borderColor || 'transparent', color: textColor }}
        >
          <Globe size={16} />
          {e.label}
        </a>
      ))}
    </div>
  )
}
