import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItemOption {
  variant?: { name: string; price_delta: number }
  modifiers?: { name: string; price: number }[]
}

export interface CartItem {
  id: string          // menuItemId + options hash
  menuItemId: string
  name: string
  photo_url?: string | null
  basePrice: number
  quantity: number
  options: CartItemOption
  lineTotal: number
}

interface CartStore {
  items: CartItem[]
  tenantSlug: string
  tableNumber: string | null
  addItem: (item: Omit<CartItem, 'id' | 'quantity' | 'lineTotal'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clear: () => void
  setContext: (slug: string, table: string | null) => void
  total: () => number
  count: () => number
}

function makeId(menuItemId: string, options: CartItemOption): string {
  return menuItemId + JSON.stringify(options)
}

function calcLineTotal(basePrice: number, options: CartItemOption, qty: number): number {
  const variantDelta = options.variant?.price_delta ?? 0
  const modTotal = (options.modifiers ?? []).reduce((s, m) => s + m.price, 0)
  return (basePrice + variantDelta + modTotal) * qty
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantSlug: '',
      tableNumber: null,

      setContext: (slug, table) => {
        const state = get()
        if (state.tenantSlug !== slug || state.tableNumber !== table) {
          set({ tenantSlug: slug, tableNumber: table })
        }
      },

      addItem: (item) => {
        const id = makeId(item.menuItemId, item.options)
        set(state => {
          const existing = state.items.find(i => i.id === id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === id
                  ? { ...i, quantity: i.quantity + 1, lineTotal: calcLineTotal(i.basePrice, i.options, i.quantity + 1) }
                  : i
              )
            }
          }
          return {
            items: [...state.items, {
              ...item,
              id,
              quantity: 1,
              lineTotal: calcLineTotal(item.basePrice, item.options, 1),
            }]
          }
        })
      },

      removeItem: (id) => set(state => ({ items: state.items.filter(i => i.id !== id) })),

      updateQty: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.id === id ? { ...i, quantity: qty, lineTotal: calcLineTotal(i.basePrice, i.options, qty) } : i
          )
        }))
      },

      clear: () => set({ items: [] }),

      total: () => get().items.reduce((s, i) => s + i.lineTotal, 0),

      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    {
      name: 'qrculinary-cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
)
