"use client"
import { Calendar } from "lucide-react"

export type DateRange = 'today' | 'week' | 'month' | 'all'

export function DateRangePicker({ value, onChange }: { value: DateRange, onChange: (v: DateRange) => void }) {
  const options: { id: DateRange, label: string }[] = [
    { id: 'today', label: 'Сегодня' },
    { id: 'week', label: 'Неделя' },
    { id: 'month', label: 'Месяц' },
    { id: 'all', label: 'Всё время' },
  ]

  return (
    <div className="flex bg-surface-2 rounded-lg p-1 w-full max-w-sm border border-border">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`
            flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all
            ${value === opt.id 
              ? 'bg-brand text-black shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
