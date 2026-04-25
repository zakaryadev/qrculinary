'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--background)' }}>
      <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {error.message || 'Попробуйте обновить страницу'}
      </p>
      <button onClick={reset} className="btn-primary">
        Обновить страницу
      </button>
    </div>
  )
}
