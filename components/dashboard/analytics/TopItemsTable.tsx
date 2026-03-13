"use client"
import { formatPrice } from "@/lib/utils"

interface ItemStat {
  item_id: string
  item_name: string
  views: number
  orders: number
}

export function TopItemsTable({ items }: { items: ItemStat[] }) {
  return (
    <div className="card h-full">
      <h3 className="text-lg font-semibold mb-6">Топ блюд</h3>
      
      {items.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          Нет данных за выбранный период
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-semibold text-text-secondary border-b border-border uppercase tracking-wider">
                <th className="pb-3 pr-4 font-bold">Блюдо</th>
                <th className="pb-3 px-4 text-center font-bold">Просмотры</th>
                <th className="pb-3 pl-4 text-right font-bold">Заказы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.item_id} className="text-sm group hover:bg-surface-2/50 transition-colors">
                  <td className="py-4 pr-4 font-medium">{item.item_name}</td>
                  <td className="py-4 px-4 text-center text-text-secondary">{item.views}</td>
                  <td className="py-4 pl-4 text-right font-bold text-brand">{item.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
