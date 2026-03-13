'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderItem, OrderStatus } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Clock, Check, ChefHat } from 'lucide-react'

type OrderWithItems = Order & { items: OrderItem[] }

const STATUSES = [
  { id: 'new',     label: 'Новые',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { id: 'cooking', label: 'Готовятся',color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { id: 'ready',   label: 'Готовы',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { id: 'done',    label: 'Выданы',   color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
]

export default function KanbanOrdersPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyWithNote, setOnlyWithNote] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single() as any
      if (!tenant) return
      setTenantId(tenant.id)
      await fetchOrders(tenant.id)

      // Subscribe to realtime for data refresh only (notifications handled globally)
      const channel = supabase
        .channel('public:orders:kanban')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
          () => fetchOrders(tenant.id)
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [])

  const fetchOrders = async (tid: string) => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tid)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false }) as any

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

    const fullOrders = ordersData.map((o: any) => ({
      ...o,
      items: itemsData?.filter((i: any) => i.order_id === o.id) || []
    }))

    setOrders(fullOrders)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    if (!tenantId) return
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await supabase.from('orders').update({ status } as any).eq('id', id)
  }

  const filteredOrders = orders.filter(o => {
    if (onlyWithNote && !o.guest_note) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const tableMatch = o.table_number?.toLowerCase().includes(q)
      const idMatch = o.id.split('-')[0].toLowerCase().includes(q)
      if (!tableMatch && !idMatch) return false
    }
    return true
  })

  if (loading) return <div className="p-8">Загрузка заказов...</div>

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Текущие заказы</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Сегодня · {filteredOrders.length} {filteredOrders.length !== orders.length ? `из ${orders.length} шт` : 'шт'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <input 
            type="text" 
            placeholder="Поиск по столу или ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input text-sm w-full sm:w-64 py-2 px-3"
          />
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none whitespace-nowrap">
              <input 
                type="checkbox" 
                checked={onlyWithNote} 
                onChange={e => setOnlyWithNote(e.target.checked)} 
                className="w-4 h-4 rounded text-[var(--brand)] focus:ring-[var(--brand)]" 
              />
              С комментарием
            </label>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0 overflow-x-auto">
        {STATUSES.map(col => {
          const colOrders = filteredOrders.filter(o => o.status === col.id)
          return (
            <div key={col.id} className="flex flex-col w-[320px] flex-shrink-0 card p-4" style={{ background: 'var(--surface-2)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">{col.label}</div>
                <div className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: col.bg, color: col.color }}>
                  {colOrders.length}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {colOrders.map(order => (
                  <div key={order.id} className="card p-4 transition-all hover:scale-[1.01]">
                    <div className="flex items-start justify-between mb-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          #{order.id.split('-')[0].toUpperCase()}
                        </div>
                        <div className="font-bold text-lg">
                          {order.table_number ? `Стол ${order.table_number}` : 'С собой'}
                        </div>
                      </div>
                      <div className="text-xs font-medium px-2 py-1 rounded flex items-center gap-1"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        <Clock size={12} />
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.items.map(item => {
                        const opts = item.selected_options as any
                        const hasOpts = opts && (opts.variant || (opts.modifiers && opts.modifiers.length > 0))

                        return (
                          <div key={item.id} className="text-sm">
                            <div className="flex justify-between font-medium">
                              <span><span style={{ color: 'var(--brand)' }}>{item.quantity}x</span> {item.name}</span>
                            </div>
                            {hasOpts && (
                              <div className="text-xs mt-0.5 ml-4 space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {opts.variant && <div>Размер: {opts.variant.name}</div>}
                                {opts.modifiers?.map((m: any) => <div key={m.name}>+ {m.name}</div>)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {order.guest_note && (
                      <div className="text-xs p-2 rounded-lg mb-3" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <strong>Комментарий:</strong> {order.guest_note}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 mt-auto border-t" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-bold">{formatPrice(order.total)}</span>

                      <div className="flex gap-2">
                        {col.id === 'new' && (
                          <button onClick={() => updateStatus(order.id, 'cooking')} className="btn-primary text-xs py-1.5 px-3">
                            <ChefHat size={14} className="mr-1" /> Принять
                          </button>
                        )}
                        {col.id === 'cooking' && (
                          <button onClick={() => updateStatus(order.id, 'ready')} className="btn-primary text-xs py-1.5 px-3" style={{ background: '#10b981' }}>
                            <Check size={14} className="mr-1" /> Готово
                          </button>
                        )}
                        {col.id === 'ready' && (
                          <button onClick={() => updateStatus(order.id, 'done')} className="btn-ghost text-xs py-1.5 px-3">
                            Выдано
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colOrders.length === 0 && (
                  <div className="text-center py-10 opacity-40 text-sm">
                    Нет заказов
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
