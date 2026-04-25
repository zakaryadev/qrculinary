export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-64 rounded bg-[var(--surface-2)] mb-2" />
      <div className="h-4 w-96 rounded bg-[var(--surface-2)] mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
            <div className="h-8 w-16 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
          </div>
        ))}
      </div>
      <div className="h-6 w-40 rounded bg-[var(--surface-2)] mb-4" />
      <div className="grid md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-20" />
        ))}
      </div>
    </div>
  )
}
