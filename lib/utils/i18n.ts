export type Lang = 'ru' | 'uz' | 'en'

export function t(
  item: any,
  lang: Lang,
  field: 'name' | 'description' = 'name'
): string {
  if (!item) return ''

  const key = field === 'name' 
    ? { ru: 'name_ru', uz: 'name_uz', en: 'name_en' }
    : { ru: 'description_ru', uz: 'description_uz', en: 'description_en' }

  return item[key[lang]] 
    || item[key['ru']] 
    || item['name'] 
    || item['description']
    || ''
}

export const ui = {
  all: { ru: 'Всё', uz: 'Barchasi', en: 'All' },
  cart: { ru: 'Корзина', uz: 'Savat', en: 'Cart' },
  add_to_cart: { ru: 'В корзину', uz: 'Savatga', en: 'Add to cart' },
  search: { ru: 'Поиск...', uz: 'Qidirish...', en: 'Search...' },
  not_found: { ru: 'Ничего не найдено', uz: 'Hech narsa topilmadi', en: 'Nothing found' },
  reset: { ru: 'Сбросить всё', uz: 'Barchasini bekor qilish', en: 'Reset all' },
  found: { ru: 'Найдено', uz: 'Topildi', en: 'Found' },
  size: { ru: 'Размер', uz: 'Hajmi', en: 'Size' },
  additions: { ru: 'Добавки', uz: 'Qo\'shimchalar', en: 'Additions' },
  total: { ru: 'Итого', uz: 'Jami', en: 'Total' },
  added: { ru: 'Добавлено!', uz: 'Qo\'shildi!', en: 'Added!' },
  tag_vegan: { ru: 'Веган', uz: 'Vegan', en: 'Vegan' },
  tag_vegetarian: { ru: 'Вегетарианское', uz: 'Vegetarian', en: 'Vegetarian' },
  tag_spicy: { ru: 'Острое', uz: 'Achchiq', en: 'Spicy' },
  tag_hit: { ru: 'Хит', uz: 'Xit', en: 'Hit' },
  tag_new: { ru: 'Новинка', uz: 'Yangi', en: 'New' },
  tag_gluten_free: { ru: 'Без глютена', uz: 'Glyutensiz', en: 'Gluten free' }
}

export function t_ui(key: keyof typeof ui, lang: Lang): string {
  return ui[key][lang] || ui[key]['ru']
}
