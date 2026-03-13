"use client"
import { ArrowUpRight, ArrowDownRight, Users, MousePointer2, ShoppingCart, Percent } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: any
  color: string
}

export function StatCards({ 
  menuViews, 
  totalOrders, 
  conversionRate 
}: { 
  menuViews: number, 
  totalOrders: number, 
  conversionRate: number 
}) {
  const stats: StatCardProps[] = [
    { 
      label: 'Просмотры меню', 
      value: menuViews.toLocaleString(), 
      icon: MousePointer2, 
      color: 'var(--brand)' 
    },
    { 
      label: 'Заказы', 
      value: totalOrders.toLocaleString(), 
      icon: ShoppingCart, 
      color: '#818CF8' 
    },
    { 
      label: 'Конверсия', 
      value: `${conversionRate}%`, 
      icon: Percent, 
      color: '#F59E0B' 
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">{stat.label}</span>
              <div className="p-2 rounded-lg" style={{ background: `${stat.color}18`, color: stat.color }}>
                <Icon size={18} />
              </div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        )
      })}
    </div>
  )
}
