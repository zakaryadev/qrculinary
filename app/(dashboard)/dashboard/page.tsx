import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/app-url'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UtensilsCrossed, QrCode, Star, ShoppingBag } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tenant } = await supabase
    .from('tenants').select('*').eq('owner_id', user.id).single()
  if (!tenant) redirect('/onboarding')

  // Stats
  const [{ count: menuCount }, { count: categoryCount }, { count: qrCount }, { count: ordersCount }] = await Promise.all([
    supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ])

  const stats = [
    { label: 'Блюд в меню',    value: menuCount ?? 0,     icon: UtensilsCrossed, href: '/dashboard/menu',   color: '#3ECF8E' },
    { label: 'Категорий',      value: categoryCount ?? 0, icon: UtensilsCrossed, href: '/dashboard/menu',   color: '#818CF8' },
    { label: 'QR-кодов',       value: qrCount ?? 0,       icon: QrCode,          href: '/dashboard/qr',    color: '#F59E0B' },
    { label: 'Заказов всего',  value: ordersCount ?? 0,   icon: ShoppingBag,     href: '/dashboard/orders', color: '#F87171' },
  ]

  const appUrl = getAppUrl()
  const menuUrl = `${appUrl}/menu/${tenant.slug}`

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Добро пожаловать, {tenant.name}!</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ваше меню доступно по ссылке:{' '}
          <Link href={menuUrl} target="_blank" className="underline" style={{ color: 'var(--brand)' }}>
            {menuUrl}
          </Link>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <div className="card hover:border-opacity-60 transition-all cursor-pointer group" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18`, color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/menu',   label: '+ Добавить блюдо',    desc: 'Пополните меню новыми позициями',  color: 'var(--brand)' },
          { href: '/dashboard/qr',     label: '+ Создать QR для стола', desc: 'QR-код для конкретного стола', color: '#818CF8' },
          { href: `/menu/${tenant.slug}`, label: '👁 Открыть меню',   desc: 'Посмотреть как видят гости',     color: '#F59E0B', target: '_blank' },
        ].map(({ href, label, desc, color, target }) => (
          <Link key={href} href={href} target={target}>
            <div className="card cursor-pointer hover:scale-[1.02] transition-transform">
              <div className="font-semibold mb-1" style={{ color }}>{label}</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state cta */}
      {(menuCount ?? 0) === 0 && (
        <div className="mt-8 p-6 rounded-xl text-center border-dashed border-2"
          style={{ borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">🍽️</div>
          <h3 className="text-lg font-semibold mb-1">Меню пока пустое</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Добавьте первое блюдо, чтобы гости могли увидеть ваше меню</p>
          <Link href="/dashboard/menu" className="btn-primary">Добавить первое блюдо</Link>
        </div>
      )}
    </div>
  )
}
