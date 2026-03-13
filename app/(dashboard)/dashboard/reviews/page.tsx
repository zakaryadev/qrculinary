'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Review } from '@/lib/types'
import { Star, MessageSquare, Eye, EyeOff } from 'lucide-react'

export default function ReviewsPage() {
  const supabase = createClient()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  // Filters
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [visFilter, setVisFilter] = useState<'all'|'visible'|'hidden'>('all')
  const [sortField, setSortField] = useState<'newest'|'oldest'|'rating_desc'|'rating_asc'>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single() as any
      if (!tenant) return
      setTenantId(tenant.id)
      fetchReviews(tenant.id)
    }
    load()
  }, [])

  const fetchReviews = async (tid: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false }) as any
    setReviews(data ?? [])
    setLoading(false)
  }

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase.from('reviews').update({ is_visible: !current }).eq('id', id)
    fetchReviews(tenantId!)
  }

  const saveReply = async (id: string) => {
    const reply = replyText[id]
    if (!reply?.trim()) return
    await supabase.from('reviews').update({ reply: reply.trim() }).eq('id', id)
    fetchReviews(tenantId!)
  }

  if (loading) return <div className="p-8">Загрузка отзывов...</div>

  // Filter & Sort
  const filteredReviews = reviews.filter(r => {
    if (ratingFilter !== 'all') {
      if (ratingFilter === 2 && r.rating > 2) return false
      if (ratingFilter !== 2 && r.rating !== ratingFilter) return false
    }
    if (visFilter === 'visible' && !r.is_visible) return false
    if (visFilter === 'hidden' && r.is_visible) return false
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const authorMatch = r.author_name?.toLowerCase().includes(q)
      const commentMatch = r.comment?.toLowerCase().includes(q)
      if (!authorMatch && !commentMatch) return false
    }
    return true
  }).sort((a, b) => {
    if (sortField === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortField === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    if (sortField === 'rating_desc') return b.rating - a.rating
    if (sortField === 'rating_asc') return a.rating - b.rating
    return 0
  })

  // Avg rating
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold">Отзывы гостей</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управляйте обратной связью и отвечайте гостям
          </p>
        </div>

        <div className="flex items-center gap-6 card px-6 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Star fill="#f59e0b" color="#f59e0b" size={20} />
              {avg}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Средняя оценка</div>
          </div>
          <div className="w-px h-10" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Всего отзывов</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {reviews.length > 0 && (
        <div className="card p-4 mb-6 space-y-4" style={{ background: 'var(--surface-2)' }}>
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
            <div className="relative flex-1 w-full xl:max-w-md">
              <input 
                type="text" 
                placeholder="Поиск по имени или отзыву..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input w-full pl-9 py-2 text-sm text-[var(--text-primary)]"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ pointerEvents: 'none' }}>🔍</div>
            </div>
            
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-4 w-full xl:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Рейтинг:</span>
                <div className="flex flex-wrap bg-white dark:bg-black/20 p-1 rounded-lg border text-xs" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => setRatingFilter('all')} className={`px-2.5 py-1 rounded-md transition-colors ${ratingFilter === 'all' ? 'bg-[var(--brand)] text-black font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>Все</button>
                  <button onClick={() => setRatingFilter(5)} className={`px-2.5 py-1 rounded-md transition-colors ${ratingFilter === 5 ? 'bg-[var(--brand)] text-black font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>5</button>
                  <button onClick={() => setRatingFilter(4)} className={`px-2.5 py-1 rounded-md transition-colors ${ratingFilter === 4 ? 'bg-[var(--brand)] text-black font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>4</button>
                  <button onClick={() => setRatingFilter(3)} className={`px-2.5 py-1 rounded-md transition-colors ${ratingFilter === 3 ? 'bg-[var(--brand)] text-black font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>3</button>
                  <button onClick={() => setRatingFilter(2)} className={`px-2.5 py-1 rounded-md transition-colors ${ratingFilter === 2 ? 'bg-[var(--brand)] text-black font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface)]'}`}>≤2</button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Статус:</span>
                <select value={visFilter} onChange={e => setVisFilter(e.target.value as any)} className="input py-2 text-xs bg-[var(--surface)] border-[var(--border)]">
                  <option value="all">Все отзывы</option>
                  <option value="visible">Опубликованы</option>
                  <option value="hidden">Скрыты</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>Сорт:</span>
                <select value={sortField} onChange={e => setSortField(e.target.value as any)} className="input py-2 text-xs bg-[var(--surface)] border-[var(--border)]">
                  <option value="newest">Сначала новые</option>
                  <option value="oldest">Сначала старые</option>
                  <option value="rating_desc">Сначала высокие оценки</option>
                  <option value="rating_asc">Сначала низкие оценки</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-16 card opacity-60 border-dashed border-2">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold mb-1">Пока нет отзывов</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ваши гости ещё не оставили ни одной оценки</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 card" style={{ background: 'var(--surface)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>По вашим фильтрам ничего не найдено</p>
          <button onClick={() => { setRatingFilter('all'); setVisFilter('all'); setSearchQuery(''); setSortField('newest'); }} className="btn-ghost text-sm mt-3 border border-[var(--border)] px-4 py-2 rounded-lg hover:bg-[var(--surface-2)]">Сбросить фильтры</button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <div key={review.id} className="card p-5 transition-all w-full flex flex-col sm:flex-row gap-5">
              {/* Rating Col */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                  <Star fill="#f59e0b" color="#f59e0b" size={24} />
                </div>
                <div className="font-bold text-lg">{review.rating} / 5</div>
                {!review.is_visible && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">Скрыт</span>
                )}
              </div>

              {/* Content Col */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold">{review.author_name}</div>
                  <div className="text-xs flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                    <button onClick={() => toggleVisibility(review.id, review.is_visible)} 
                      className="hover:text-amber-500 transition-colors" title={review.is_visible ? 'Скрыть отзыв' : 'Опубликовать отзыв'}>
                      {review.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {review.comment ? (
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{review.comment}</p>
                ) : (
                  <p className="text-sm mb-4 italic" style={{ color: 'var(--text-muted)' }}>Без комментария</p>
                )}

                {/* Reply Section */}
                {review.reply ? (
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--surface-2)' }}>
                    <div className="font-semibold text-xs mb-1" style={{ color: 'var(--brand)' }}>Ваш ответ:</div>
                    <p style={{ color: 'var(--text-secondary)' }}>{review.reply}</p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-sm py-2"
                      placeholder="Ответить гостю..."
                      value={replyText[review.id] || ''}
                      onChange={e => setReplyText({ ...replyText, [review.id]: e.target.value })}
                    />
                    <button onClick={() => saveReply(review.id)} className="btn-primary text-sm px-4">
                      Ответить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
