'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { Order, OrderItem } from '@/lib/types'
import { Calendar, Filter, ChevronDown, History } from 'lucide-react'

type OrderWithItems = Order & { items: OrderItem[] }

const STATUS_OPTIONS = [
  { id: '', label: 'Все статусы' },
  { id: 'new', label: 'Новые' },
  { id: 'cooking', label: 'Готовятся' },
  { id: 'ready', label: 'Готовы' },
  { id: 'done', label: 'Выданы' },
]

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  new:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: 'Новый' },
  cooking: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Готовится' },
  ready:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'Готов' },
  done:    { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Выдан' },
}

function formatDate(val: string) {
  return new Date(val).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function HistoryPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Filters
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const [dateFrom, setDateFrom] = useState(sevenDaysAgo.toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [minTotal, setMinTotal] = useState('')

  const setPreset = (days: number) => {
    const d = new Date()
    setDateTo(d.toISOString().split('T')[0])
    if (days === 0) {
      setDateFrom(d.toISOString().split('T')[0])
    } else {
      d.setDate(d.getDate() - days)
      setDateFrom(d.toISOString().split('T')[0])
    }
  }

  // Expanded rows
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filtering on client side
  const filteredOrders = orders.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const tableMatch = o.table_number?.toLowerCase().includes(q)
      const idMatch = o.id.split('-')[0].toLowerCase().includes(q)
      if (!tableMatch && !idMatch) return false
    }
    if (minTotal.trim()) {
      const min = parseFloat(minTotal)
      if (!isNaN(min) && o.total < min) return false
    }
    return true
  })

  // Stats
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const doneOrders = filteredOrders.filter(o => o.status === 'done')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single() as any
      if (!tenant) return
      setTenantId(tenant.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (!tenantId) return
    fetchOrders()
  }, [tenantId, dateFrom, dateTo, statusFilter])

  const fetchOrders = async () => {
    if (!tenantId) return
    setLoading(true)

    const fromISO = new Date(dateFrom + 'T00:00:00').toISOString()
    const toDate = new Date(dateTo + 'T23:59:59')
    const toISO = toDate.toISOString()

    let query = supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', fromISO)
      .lte('created_at', toISO)
      .order('created_at', { ascending: false }) as any

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: ordersData } = await query

    if (!ordersData?.length) {
      setOrders([])
      setLoading(false)
      return
    }

    const orderIds = ordersData.map((o: any) => o.id)
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds) as any

    const full = ordersData.map((o: any) => ({
      ...o,
      items: itemsData?.filter((i: any) => i.order_id === o.id) || []
    }))
    setOrders(full)
    setLoading(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(62,207,142,0.15)' }}>
          <History size={20} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">История заказов</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Все заказы и архив</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-4 flex flex-col" style={{ background: 'var(--surface)' }}>
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-medium mr-2" style={{ color: 'var(--text-muted)' }}>Быстрые даты:</span>
          <button onClick={() => setPreset(0)} className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--surface-2)]">Сегодня</button>
          <button onClick={() => setPreset(1)} className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--surface-2)]">Вчера</button>
          <button onClick={() => setPreset(7)} className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--surface-2)]">Неделя</button>
          <button onClick={() => setPreset(30)} className="text-xs px-3 py-1.5 rounded-md border transition-colors hover:bg-[var(--surface-2)]">Месяц</button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Поиск</label>
            <input 
              type="text" 
              placeholder="Стол или ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm w-full outline-none transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex flex-col gap-1 w-[120px] flex-shrink-0">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Мин. чек</label>
            <input 
              type="number" 
              placeholder="0" 
              value={minTotal}
              onChange={e => setMinTotal(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm w-full outline-none transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex flex-col gap-1 w-[130px] flex-shrink-0">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Дата с</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent outline-none w-full"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 w-[130px] flex-shrink-0">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Дата по</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent outline-none w-full"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 w-[130px] flex-shrink-0">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Статус</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm relative" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent outline-none pr-6 appearance-none cursor-pointer w-full"
                style={{ color: 'var(--text-primary)' }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.id} value={s.id} style={{ background: 'var(--surface)' }}>{s.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2" style={{ color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Заказов', value: filteredOrders.length },
          { label: 'Выполнено', value: doneOrders.length },
          { label: 'Выручка', value: formatPrice(totalRevenue) },
        ].map(stat => (
          <div key={stat.label} className="card p-4" style={{ background: 'var(--surface)' }}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="card p-12 text-center" style={{ background: 'var(--surface)' }}>
          <History size={40} className="mx-auto mb-3 opacity-30" />
          <p style={{ color: 'var(--text-muted)' }}>Нет заказов за выбранный период</p>
        </div>
      ) : (
        <div className="card overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Заказ</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Стол</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Дата</th>
                <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-muted)' }}>Статус</th>
                <th className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-muted)' }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const style = STATUS_STYLES[order.status] || STATUS_STYLES.done
                const expanded = expandedId === order.id
                return (
                  <Fragment key={order.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : order.id)}
                      className="border-b cursor-pointer transition-colors hover:opacity-80"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        #{order.id.split('-')[0].toUpperCase()}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {order.table_number ? `Стол ${order.table_number}` : 'С собой'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                    {expanded && (
                      <tr style={{ background: 'var(--surface-2)' }}>
                        <td colSpan={5} className="px-6 py-3">
                          <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Состав заказа:</div>
                          <div className="space-y-1">
                            {order.items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  <span style={{ color: 'var(--brand)' }}>{item.quantity}×</span> {item.name}
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {order.guest_note && (
                            <div className="mt-2 text-xs p-2 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                              📝 {order.guest_note}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  )
}
