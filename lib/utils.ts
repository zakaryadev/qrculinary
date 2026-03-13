import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-а-яёа-я]/gi, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    // Transliterate Cyrillic
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',
        й:'j',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',
        у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',
        ь:'',э:'e',ю:'yu',я:'ya'
      }
      return map[char] ?? char
    })
    .trim()
}

/**
 * Format price in UZS
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' сум'
}

/**
 * Tag label map
 */
export const TAG_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  vegan:       { label: 'Веган',         emoji: '🌿', color: 'bg-green-100 text-green-800' },
  vegetarian:  { label: 'Вегетарианское', emoji: '🥦', color: 'bg-emerald-100 text-emerald-800' },
  spicy:       { label: 'Острое',        emoji: '🌶️', color: 'bg-red-100 text-red-800' },
  hit:         { label: 'Хит',           emoji: '🔥', color: 'bg-orange-100 text-orange-800' },
  new:         { label: 'Новинка',       emoji: '✨', color: 'bg-blue-100 text-blue-800' },
  gluten_free: { label: 'Без глютена',  emoji: '🌾', color: 'bg-yellow-100 text-yellow-800' },
}
