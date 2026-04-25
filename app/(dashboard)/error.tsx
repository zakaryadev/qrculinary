'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-60 text-center">
      <h2 className="text-xl font-bold mb-2">Что-то пошло не так</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {error.message || 'Попробуйте обновить страницу'}
      </p>
      <button onClick={reset} className="btn-primary">
        Попробовать снова
      </button>
    </div>
  )
}
