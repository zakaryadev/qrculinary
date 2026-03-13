'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Star, Send } from 'lucide-react'

export default function FeedbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [authorName, setAuthorName] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [primaryColor, setPrimaryColor] = useState<string>('#3ECF8E')

  // Fetch tenant color
  useEffect(() => {
    supabase.from('tenants').select('primary_color').eq('slug', slug).single()
      .then(({ data }: any) => {
        if (data?.primary_color) setPrimaryColor(data.primary_color)
      })
  }, [slug, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)

    // 1. Узнаем tenant_id по slug
    const { data: tenant } = await supabase.from('tenants').select('id,primary_color').eq('slug', slug).single() as any
    if (!tenant) return

    await (supabase.from('reviews') as any).insert({
      tenant_id: tenant.id,
      rating,
      author_name: authorName.trim() || 'Гость',
      comment: comment.trim() || null,
    })

    setSuccess(true)
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--background)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)' }}>
          <Star size={32} fill={primaryColor} color={primaryColor} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Спасибо за отзыв!</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Ваша оценка поможет нам стать лучше.
        </p>
        <Link href={`/menu/${slug}`} className="btn-primary" style={{ background: primaryColor }}>
          Вернуться в меню
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Оставить отзыв</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="card text-center mb-6">
          <h2 className="font-semibold mb-1">Как вам у нас?</h2>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Оцените качество еды и сервиса</p>

          <div className="flex justify-center gap-2 relative">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className="transition-transform hover:scale-110 active:scale-90"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={40}
                  fill={(hoverRating || rating) >= star ? primaryColor : 'transparent'}
                  color={(hoverRating || rating) >= star ? primaryColor : 'var(--border)'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card">
            <div className="mb-4">
              <label className="text-sm font-semibold mb-2 block">Ваше имя</label>
              <input
                className="input w-full"
                placeholder="Как к вам обращаться?"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Комментарий</label>
              <textarea
                className="input w-full resize-none"
                rows={4}
                placeholder="Что понравилось? Что можно улучшить?"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary w-full justify-center py-3.5 text-base shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: primaryColor }}>
            {submitting ? 'Отправка...' : <><Send size={18} className="mr-2" /> Отправить отзыв</>}
          </button>
        </form>
      </div>
    </div>
  )
}
