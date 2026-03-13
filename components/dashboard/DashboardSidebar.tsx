'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, QrCode, ShoppingBag, Settings, LogOut, ExternalLink, Star, History, Volume2, VolumeX, BarChart3, BadgePercent, MapPin, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useNotifications } from './OrderNotificationProvider'
import { useState, useEffect } from 'react'

interface Props {
  tenant: { id: string; name: string; slug: string; logo_url: string | null }
}

const NAV = [
  { href: '/dashboard',           label: 'Обзор',     icon: LayoutDashboard },
  { href: '/dashboard/menu',      label: 'Меню',      icon: UtensilsCrossed },
  { href: '/dashboard/promotions',label: 'Акции',     icon: BadgePercent },
  { href: '/dashboard/branches',  label: 'Филиалы',   icon: MapPin },
  { href: '/dashboard/qr',        label: 'QR-коды',   icon: QrCode },
  { href: '/dashboard/orders',    label: 'Заказы',    icon: ShoppingBag },
  { href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/dashboard/history',   label: 'История',   icon: History },
  { href: '/dashboard/reviews',   label: 'Отзывы',    icon: Star },
  { href: '/dashboard/settings',  label: 'Настройки', icon: Settings },
]

export default function DashboardSidebar({ tenant }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { audioEnabled, toggleAudio } = useNotifications()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold text-lg" style={{ color: 'var(--brand)' }}>
            QRCulinary
          </Link>
          {/* Close button — only on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--brand)', color: '#000' }}>
            {tenant.name[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{tenant.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>/{tenant.slug}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(62,207,142,0.12)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          title={audioEnabled ? 'Выключить звук уведомлений' : 'Включить звук уведомлений'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all"
          style={{
            color: audioEnabled ? 'var(--brand)' : 'var(--text-secondary)',
            background: audioEnabled ? 'rgba(62,207,142,0.1)' : 'transparent',
          }}
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {audioEnabled ? 'Звук включён' : 'Звук выключен'}
        </button>
        <Link
          href={`/menu/${tenant.slug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ExternalLink size={16} />
          Открыть меню
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all"
          style={{ color: 'var(--text-secondary)', background: 'transparent' }}
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
        >
          <Menu size={22} style={{ color: 'var(--text-primary)' }} />
        </button>
        <Link href="/" className="font-bold text-base" style={{ color: 'var(--brand)' }}>
          QRCulinary
        </Link>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--brand)', color: '#000' }}>
          {tenant.name[0].toUpperCase()}
        </div>
      </div>

      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r h-full"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative w-72 max-w-[85vw] flex flex-col h-full animate-slide-in-left"
            style={{ background: 'var(--surface)' }}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
