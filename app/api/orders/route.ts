import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/services/order'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const { tenantSlug, tableNumber, items, total, guestNote } = await req.json()

    if (!tenantSlug || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const rateKey = `order:${clientIp}`

    if (!rateLimit(rateKey, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    }

    const result = await createOrder({ tenantSlug, tableNumber, items, total, guestNote })
    return NextResponse.json({ success: true, orderId: result.orderId })

  } catch (error: any) {
    console.error('Order API Error:', error)
    const status = error.message === 'Tenant not found' ? 404 : 500
    return NextResponse.json(
      { error: status === 404 ? 'Tenant not found' : 'Internal Server Error' },
      { status }
    )
  }
}
