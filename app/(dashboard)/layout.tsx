import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import OrderNotificationProvider from '@/components/dashboard/OrderNotificationProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id,name,slug,logo_url')
    .eq('owner_id', user.id)
    .single()

  if (!tenant) redirect('/onboarding')

  return (
    <OrderNotificationProvider tenant={tenant}>
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
        <DashboardSidebar tenant={tenant} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </OrderNotificationProvider>
  )
}
