import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintClient from './PrintClient'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: qrCode } = await supabase
    .from('qr_codes')
    .select('*, tenant:tenants(*)')
    .eq('id', id)
    .single()

  if (!qrCode) return <div>QR code not found</div>

  return <PrintClient qrCode={qrCode} tenant={qrCode.tenant} />
}
