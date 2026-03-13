import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { tenantSlug, tableNumber, items, total, guestNote } = await req.json()
    
    if (!tenantSlug || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // 1. Узнаем tenant_id по slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Найдем qr_code_id если передан стол
    let qr_code_id = null
    if (tableNumber) {
      const { data: qr } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('table_number', tableNumber)
        .maybeSingle()
      if (qr) qr_code_id = qr.id
    }

    // 2. Создаем заказ
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        qr_code_id,
        table_number: tableNumber || null,
        total,
        guest_note: guestNote || null,
        status: 'new'
      })
      .select('id')
      .single()

    if (orderError || !order) {
      throw orderError || new Error('Failed to create order')
    }

    // 3. Создаем order_items
    const orderItemsToInsert = items.map((item: any) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.lineTotal / item.quantity, // Цена за 1 шт с учетом опций
      quantity: item.quantity,
      selected_options: item.options
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    if (itemsError) {
      throw itemsError
    }

    return NextResponse.json({ success: true, orderId: order.id })
    
  } catch (error: any) {
    console.error('Order API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
