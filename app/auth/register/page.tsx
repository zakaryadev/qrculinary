'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email адрес')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Пароль должен быть минимум 8 символов')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    })
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
        <div className="text-center max-w-sm animate-fade-in">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold mb-2">Проверьте почту</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Мы отправили ссылку подтверждения на <strong>{email}</strong>.
            Перейдите по ней для завершения регистрации.
          </p>
          <Link href="/auth/login" className="btn-ghost">Вернуться к входу</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="flex justify-center mb-8">
          <span className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>QRCulinary</span>
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold mb-1">Создать аккаунт</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Бесплатно · Без банковской карты
          </p>

          <button onClick={handleGoogleLogin} className="btn-ghost w-full mb-4 justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Зарегистрироваться через Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>или</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Пароль</label>
              <input
                className="input"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Подтвердите пароль</label>
              <input
                className="input"
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? 'Создаём аккаунт...' : 'Создать аккаунт бесплатно'}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Нажимая кнопку, вы соглашаетесь с условиями использования сервиса
            </p>
          </form>
        </div>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" style={{ color: 'var(--brand)' }} className="font-medium hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
