'use client'

import { useState } from 'react'

const DAYS = [
  { id: 'mon', label: 'Понедельник' },
  { id: 'tue', label: 'Вторник' },
  { id: 'wed', label: 'Среда' },
  { id: 'thu', label: 'Четверг' },
  { id: 'fri', label: 'Пятница' },
  { id: 'sat', label: 'Суббота' },
  { id: 'sun', label: 'Воскресенье' },
]

export function WorkingHoursManager({ value, onChange }: { value: any, onChange: (v: any) => void }) {
  const [hours, setHours] = useState<any>(() => {
    // defaults
    const h = { ...value }
    DAYS.forEach(d => {
      if (!h[d.id]) {
        h[d.id] = { open: '10:00', close: '23:00', is_closed: false }
      }
    })
    return h
  })

  const updateDay = (dayId: string, updates: any) => {
    const next = { ...hours, [dayId]: { ...hours[dayId], ...updates } }
    setHours(next)
    onChange(next)
  }

  const copyToAll = (dayId: string) => {
    const toCopy = hours[dayId]
    const next = { ...hours }
    DAYS.forEach(d => {
      next[d.id] = { ...toCopy }
    })
    setHours(next)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Расписание по дням</h3>
      </div>
      
      <div className="border rounded-xl flex flex-col divide-y overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {DAYS.map((day) => {
          const conf = hours[day.id]
          return (
            <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-[var(--surface)]">
              <div className="flex items-center gap-3 w-40">
                <input type="checkbox" 
                  checked={!conf.is_closed} 
                  onChange={e => updateDay(day.id, { is_closed: !e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                />
                <span className="text-sm font-medium" style={{ color: conf.is_closed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {day.label}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                {conf.is_closed ? (
                  <span className="text-sm px-3 py-1.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    Закрыто
                  </span>
                ) : (
                  <>
                    <input type="time" className="input text-sm py-1.5 px-2" value={conf.open} onChange={e => updateDay(day.id, { open: e.target.value })} />
                    <span style={{ color: 'var(--text-muted)' }}>–</span>
                    <input type="time" className="input text-sm py-1.5 px-2" value={conf.close} onChange={e => updateDay(day.id, { close: e.target.value })} />
                  </>
                )}
              </div>
              
              <div className="flex justify-end">
                <button type="button" onClick={() => copyToAll(day.id)} className="text-xs hover:underline" style={{ color: 'var(--brand)' }}>
                  Применить ко всем
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
