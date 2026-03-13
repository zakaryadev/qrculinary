import { Phone } from 'lucide-react'
import { phoneLink } from '@/lib/utils/phone'

export function CallButton({ phone, brandColor }: { phone: string, brandColor?: string }) {
  if (!phone) return null

  return (
    <a
      href={phoneLink(phone)}
      className="fixed bottom-24 right-4 z-[45] flex items-center justify-center w-14 h-14 rounded-full shadow-xl text-black hover:scale-105 active:scale-95 transition-transform md:hidden"
      style={{ background: brandColor || '#3ECF8E' }}
      aria-label="Позвонить в колл-центр"
    >
      <Phone size={24} />
    </a>
  )
}
