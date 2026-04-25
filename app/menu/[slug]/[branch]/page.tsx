import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PublicMenuClient from '../PublicMenuClient'

interface Props {
  params: Promise<{ slug: string; branch: string }>
  searchParams: Promise<{ table?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, branch: branchSlug } = await params
  const supabase = await createClient()
  const { data: tenant } = await supabase.from('tenants').select('id,name').eq('slug', slug).single()
  if (!tenant) return { title: 'Меню не найдено' }
  const { data: branch } = await supabase.from('branches').select('name').eq('tenant_id', tenant.id).eq('slug', branchSlug).single()
  return {
    title: branch ? `${tenant.name} — ${branch.name}` : tenant.name,
    description: `Меню ${tenant.name}${branch ? ` (${branch.name})` : ''}`,
  }
}

export default async function BranchMenuPage({ params, searchParams }: Props) {
  const { slug, branch: branchSlug } = await params
  const { table } = await searchParams

  const supabase = await createClient()

  // 1. Load tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!tenant) notFound()

  // 2. Load branch — must be active and belong to this tenant
  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', branchSlug)
    .eq('is_active', true)
    .single()

  if (!branch) notFound()

  // 3. Load menu data (shared across all branches of this tenant)
  const [{ data: categories }, { data: items }, { data: reviews }, { data: allTags }] = await Promise.all([
    supabase.from('categories').select('*').eq('tenant_id', tenant.id).eq('is_visible', true).order('sort_order'),
    supabase.from('menu_items').select('*').eq('tenant_id', tenant.id).eq('is_hidden', false).eq('is_available', true).or('promo_ends_at.is.null,promo_ends_at.gte.now()').order('sort_order'),
    supabase.from('reviews').select('rating').eq('tenant_id', tenant.id).eq('is_visible', true),
    supabase.from('menu_tags').select('*'),
  ])

  // 4. Analytics
  await supabase.from('analytics_events').insert({
    tenant_id: tenant.id,
    event_type: table ? 'qr_scan' : 'menu_view',
    meta: { table_number: table ?? null, slug, branch_slug: branchSlug },
  })

  if (table) {
    await supabase.rpc('increment_qr_scan', {
      qr_table_number: table,
      qr_tenant_id: tenant.id,
    } as any)
  }

  const { data: gallery } = await supabase.from('tenant_gallery').select('*').eq('tenant_id', tenant.id).order('sort_order')

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  // Override tenant's address/phone with branch-specific values so the
  // public menu shows the correct contact info for this branch.
  const tenantWithBranch = {
    ...tenant,
    address: branch.address ?? tenant.address,
    phone: branch.phone ?? tenant.phone,
    name: `${tenant.name} · ${branch.name}`,
  }

  return (
    <PublicMenuClient
      tenant={tenantWithBranch}
      categories={categories ?? []}
      items={items ?? []}
      gallery={gallery ?? []}
      avgRating={avgRating}
      reviewCount={reviews?.length ?? 0}
      tableNumber={table}
      allTags={allTags ?? []}
    />
  )
}

export const revalidate = 60
