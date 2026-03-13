'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/lib/cart/store'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, Trash2, Plus, Minus, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const cart = useCartStore()
  const router = useRouter()
  
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState<string>('#3ECF8E')

  // Fetch tenant color
  useEffect(() => {
    const supabaseClient = createClient()
    supabaseClient.from('tenants').select('primary_color').eq('slug', slug).single()
      .then(({ data }: any) => {
        if (data?.primary_color) setPrimaryColor(data.primary_color)
      })
  }, [slug])

  const handleCheckout = async () => {
    if (cart.items.length === 0) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: cart.tenantSlug,
          tableNumber: cart.tableNumber,
          items: cart.items,
          total: cart.total(),
          guestNote: note.trim() || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Ошибка при оформлении заказа')
      }

      cart.clear()
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--background)' }}>
        <CheckCircle size={64} className="mb-4" style={{ color: primaryColor }} />
        <h1 className="text-2xl font-bold mb-2">Заказ принят!</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Ожидайте, скоро принесём.{' '}
          {cart.tableNumber && <span>Ваш стол: {cart.tableNumber}</span>}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href={`/menu/${slug}${cart.tableNumber ? `?table=${cart.tableNumber}` : ''}`} 
            className="btn-primary justify-center" style={{ background: primaryColor }}>
            Вернуться в меню
          </Link>
          <Link href={`/menu/${slug}/feedback`} className="btn-ghost justify-center">
            Оставить чаевые / отзыв
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex-1">Корзина</h1>
        {cart.items.length > 0 && (
          <button onClick={() => cart.clear()} className="text-xs font-medium" style={{ color: '#f87171' }}>
            Очистить
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {cart.items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="text-6xl mb-4 opacity-50">🛒</div>
            <h2 className="text-lg font-semibold mb-2">Корзина пуста</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Добавьте что-нибудь вкусное из меню</p>
            <Link href={`/menu/${slug}`} className="btn-primary" style={{ background: primaryColor }}>
              Перейти к меню
            </Link>
          </div>
        ) : (
          <>
            {/* Context Info */}
            <div className="p-3 rounded-xl flex items-center justify-between text-sm font-medium"
              style={{ background: 'var(--surface-2)' }}>
              <span>Стол:</span>
              <span style={{ color: cart.tableNumber ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {cart.tableNumber || 'Не указан'}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {cart.items.map(item => (
                <div key={item.id} className="card p-3 flex gap-3">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg flex-shrink-0" style={{ background: 'var(--surface-2)' }} />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-semibold text-sm leading-tight pr-2">{item.name}</div>
                      <button onClick={() => cart.removeItem(item.id)} className="p-1 -mr-1 text-red-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Options */}
                    {(item.options.variant || (item.options.modifiers && item.options.modifiers.length > 0)) && (
                      <div className="text-xs mb-2 space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {item.options.variant && <div>Размер: {item.options.variant.name}</div>}
                        {item.options.modifiers?.map(m => (
                          <div key={m.name}>+ {m.name}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div className="font-bold">{formatPrice(item.lineTotal)}</div>
                      
                      <div className="flex items-center gap-2" style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', padding: '2px' }}>
                        <button onClick={() => cart.updateQty(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => cart.updateQty(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-[#333] shadow-sm active:scale-95 transition-all">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="card p-3 w-full">
              <label className="text-sm font-semibold mb-2 block">Комментарий к заказу</label>
              <textarea
                className="input w-full text-sm resize-none"
                rows={2}
                placeholder="Например, без лука..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            
            {/* Spacer */}
            <div className="h-20" />
          </>
        )}
      </div>

      {/* Checkout Bar */}
      {cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t z-20"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between mb-3">
            <span className="font-semibold text-lg">Итого</span>
            <span className="font-bold text-xl" style={{ color: primaryColor }}>{formatPrice(cart.total())}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={submitting}
            className="btn-primary w-full justify-center py-3.5 text-base shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: primaryColor }}>
            {submitting ? 'Оформляем...' : 'Оформить заказ'}
          </button>
        </div>
      )}
    </div>
  )
}
