"use client"

interface ScanStat {
  scan_date: string
  total_scans: number
  unique_scans: number
}

export function ScansChart({ data }: { data: ScanStat[] }) {
  const maxScans = Math.max(...data.map(d => d.total_scans), 5)
  
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold mb-6">Сканирования QR</h3>
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-text-muted">
          Нет данных за выбранный период
        </div>
      ) : (
        <div className="flex items-end gap-2 h-64 w-full pt-4">
          {data.map((day) => {
            const heightTotal = (day.total_scans / maxScans) * 100
            const heightUnique = (day.unique_scans / maxScans) * 100
            
            return (
              <div key={day.scan_date} className="flex-1 flex flex-col items-center group relative">
                <div className="w-full flex flex-col items-center justify-end h-full gap-0.5">
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-2 border border-border px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-xl">
                    <div className="text-text-primary font-bold">{new Date(day.scan_date).toLocaleDateString()}</div>
                    <div className="text-brand">Всего: {day.total_scans}</div>
                    <div className="text-indigo-400">Уникальных: {day.unique_scans}</div>
                  </div>

                  {/* Bars */}
                  <div 
                    className="w-full bg-brand/20 rounded-t-sm transition-all group-hover:bg-brand/40" 
                    style={{ height: `${heightTotal}%` }}
                    title={`Всего: ${day.total_scans}`}
                  />
                  <div 
                    className="w-full bg-indigo-500/40 rounded-t-sm absolute bottom-0 transition-all group-hover:bg-indigo-500/60" 
                    style={{ height: `${heightUnique}%` }}
                    title={`Уникальных: ${day.unique_scans}`}
                  />
                </div>
                <div className="text-[10px] text-text-muted mt-2 rotate-45 origin-left whitespace-nowrap">
                  {new Date(day.scan_date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      <div className="mt-8 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-brand/40" />
          <span className="text-text-secondary">Всего сканирований</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/40" />
          <span className="text-text-secondary">Уникальные гости</span>
        </div>
      </div>
    </div>
  )
}
