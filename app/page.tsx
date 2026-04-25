import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="font-bold text-xl" style={{ color: 'var(--brand)' }}>QRCulinary</span>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">Войти</Link>
          <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Попробовать бесплатно</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{ background: 'rgba(62,207,142,0.1)', color: 'var(--brand)', border: '1px solid rgba(62,207,142,0.2)' }}>
          ✨ Бесплатно навсегда — никаких скрытых платежей
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold max-w-4xl mb-6 leading-tight">
          QR-меню для вашего<br />
          <span style={{ color: 'var(--brand)' }}>ресторана</span>
        </h1>

        <p className="text-xl max-w-xl mb-10" style={{ color: 'var(--text-secondary)' }}>
          Создайте цифровое меню за 5 минут. Гости сканируют QR — и сразу видят меню. Без установки приложений.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/register" className="btn-primary text-base py-3 px-8 animate-pulse-glow">
            Создать меню бесплатно →
          </Link>
          <a href={`/menu/${process.env.NEXT_PUBLIC_DEMO_SLUG || 'mama-roma'}`} className="btn-ghost text-base py-3 px-8">
            Посмотреть демо
          </a>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mt-20">
          {[
            { num: '5 мин', label: 'до первого QR' },
            { num: '0 ₽',   label: 'стоимость запуска' },
            { num: '∞',     label: 'блюд в меню' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-bold" style={{ color: 'var(--brand)' }}>{num}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6 px-6 pb-24 max-w-5xl mx-auto w-full">
        {[
          { icon: '📱', title: 'Мгновенное меню', desc: 'Гость сканирует QR-код — меню открывается без установки приложений.' },
          { icon: '🍽️', title: 'Простой редактор', desc: 'Добавляйте блюда, фото, описания и теги в интуитивном дашборде.' },
          { icon: '📊', title: 'Аналитика', desc: 'Отслеживайте сканирования QR, просмотры блюд и конверсию в заказы.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card text-center">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        © 2026 QRCulinary · Сделано с ❤️ для рестораторов Узбекистана
      </footer>
    </main>
  )
}
