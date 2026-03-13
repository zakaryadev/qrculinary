import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/dashboard/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tenant } = await supabase
    .from('tenants').select('id, name').eq('owner_id', user.id).single() as any
  
  if (!tenant) redirect('/onboarding')

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Аналитика</h1>
        <p className="text-text-secondary">
          Отслеживайте популярность вашего меню и активность гостей заведения {tenant.name}
        </p>
      </div>

      <AnalyticsClient tenantId={tenant.id} />
    </div>
  )
}
