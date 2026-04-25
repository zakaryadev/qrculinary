/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../lib/cart/store'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], tenantSlug: '', tableNumber: null })
  })

  it('starts empty', () => {
    expect(useCartStore.getState().items).toHaveLength(0)
    expect(useCartStore.getState().count()).toBe(0)
    expect(useCartStore.getState().total()).toBe(0)
  })

  it('adds items', () => {
    const store = useCartStore.getState()
    store.addItem({
      menuItemId: 'item-1',
      name: 'Лагман',
      photo_url: null,
      basePrice: 25000,
      options: {},
    })

    const items = useCartStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Лагман')
    expect(items[0].quantity).toBe(1)
    expect(items[0].lineTotal).toBe(25000)
    expect(useCartStore.getState().count()).toBe(1)
    expect(useCartStore.getState().total()).toBe(25000)
  })

  it('increments quantity when adding duplicate item', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })

    expect(useCartStore.getState().items).toHaveLength(1)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
    expect(useCartStore.getState().count()).toBe(2)
  })

  it('distinguishes items by options', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: { variant: { name: 'Малая', price_delta: 0 } } })
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: { variant: { name: 'Большая', price_delta: 5000 } } })

    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('removes items', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })

    const id = useCartStore.getState().items[0].id
    useCartStore.getState().removeItem(id)

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('updates quantity', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })

    const id = useCartStore.getState().items[0].id
    useCartStore.getState().updateQty(id, 3)

    expect(useCartStore.getState().items[0].quantity).toBe(3)
    expect(useCartStore.getState().items[0].lineTotal).toBe(75000)
  })

  it('removes item when quantity set to 0', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })

    const id = useCartStore.getState().items[0].id
    useCartStore.getState().updateQty(id, 0)

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('clears the cart', () => {
    const store = useCartStore.getState()
    store.addItem({ menuItemId: 'item-1', name: 'Лагман', basePrice: 25000, options: {} })
    store.addItem({ menuItemId: 'item-2', name: 'Самса', basePrice: 8000, options: {} })
    useCartStore.getState().clear()

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('calculates total with variant delta', () => {
    const store = useCartStore.getState()
    store.addItem({
      menuItemId: 'item-1',
      name: 'Лагман',
      basePrice: 25000,
      options: { variant: { name: 'Большая', price_delta: 5000 } },
    })

    expect(useCartStore.getState().total()).toBe(30000)
  })

  it('calculates total with modifiers', () => {
    const store = useCartStore.getState()
    store.addItem({
      menuItemId: 'item-1',
      name: 'Лагман',
      basePrice: 25000,
      options: { modifiers: [{ name: 'Сыр', price: 3000 }] },
    })

    expect(useCartStore.getState().total()).toBe(28000)
  })
})
