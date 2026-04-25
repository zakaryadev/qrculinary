import { createServiceClient } from '@/lib/supabase/server'

interface CreateOrderInput {
  tenantSlug: string
  tableNumber?: string
  items: {
    menuItemId: string
    name: string
    quantity: number
    lineTotal: number
    options?: Record<string, unknown>
  }[]
  total: number
  guestNote?: string
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = createServiceClient()

  // 1. Find tenant by slug
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', input.tenantSlug)
    .single()

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  // 2. Find QR code if table number provided
  let qr_code_id: string | null = null
  if (input.tableNumber) {
    const { data: qr } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('table_number', input.tableNumber)
      .maybeSingle()
    if (qr) qr_code_id = qr.id
  }

  // 3. Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant.id,
      qr_code_id,
      table_number: input.tableNumber || null,
      total: input.total,
      guest_note: input.guestNote || null,
      status: 'new',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    throw orderError || new Error('Failed to create order')
  }

  // 4. Create order items
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    name: item.name,
    price: Math.round(item.lineTotal / item.quantity),
    quantity: item.quantity,
    selected_options: item.options ?? {},
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    throw itemsError
  }

  return { orderId: order.id }
}
