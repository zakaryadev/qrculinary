export function formatPhone(phone: string): string {
  // '+998781500030' → '78 150 00 30'
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('998')) {
    const local = clean.slice(3)
    if (local.length === 9) {
      return `${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
    }
  }
  return phone
}

export function phoneLink(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  return `tel:+${clean.startsWith('998') ? clean : '998' + clean}`
}
