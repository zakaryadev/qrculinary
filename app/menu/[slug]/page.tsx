import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PublicMenuClient from './PublicMenuClient'

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ table?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('*').eq('slug', slug).single()
  if (!tenant) return { title: 'Меню не найдено' }
  return {
    title: tenant.name,
    description: tenant.description ?? `Меню ${tenant.name}`,
  }
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { table } = await searchParams

  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!tenant) notFound()

  const [{ data: categories }, { data: items }, { data: reviews }] = await Promise.all([
    supabase.from('categories').select('*').eq('tenant_id', tenant.id).eq('is_visible', true).order('sort_order'),
    supabase.from('menu_items').select('*').eq('tenant_id', tenant.id).eq('is_hidden', false).eq('is_available', true).or('promo_ends_at.is.null,promo_ends_at.gte.now()').order('sort_order'),
    supabase.from('reviews').select('rating').eq('tenant_id', tenant.id).eq('is_visible', true),
  ])

  // Analytics: record QR scan / menu view (non-blocking)
  const analyticsPromise = (async () => {
    try {
      await supabase.from('analytics_events').insert({
        tenant_id: tenant.id,
        event_type: table ? 'qr_scan' : 'menu_view',
        meta: { table_number: table ?? null, slug },
      })

      // Increment scan_count on the matching QR code (via RPC to bypass RLS)
      if (table) {
        await supabase.rpc('increment_qr_scan', {
          qr_table_number: table,
          qr_tenant_id: tenant.id,
        } as any)
      }
    } catch (e) {
      console.error('Analytics error:', e)
    }
  })()

  const { data: gallery } = await supabase.from('tenant_gallery').select('*').eq('tenant_id', tenant.id).order('sort_order')

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <PublicMenuClient
      tenant={tenant}
      categories={categories ?? []}
      items={items ?? []}
      gallery={gallery ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      tableNumber={table}
    />
  )
}

export const revalidate = 60
