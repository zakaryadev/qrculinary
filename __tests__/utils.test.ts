import { describe, it, expect } from 'vitest'
import { cn, slugify, formatPrice } from '../lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('filters falsy values', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})

describe('slugify', () => {
  it('converts latin text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('transliterates cyrillic', () => {
    expect(slugify('Привет Мир')).toBe('privet-mir')
  })

  it('handles mixed text', () => {
    expect(slugify('Меню №1')).toBe('menyu-1')
  })

  it('removes leading/trailing dashes', () => {
    expect(slugify('---foo---')).toBe('foo')
  })
})

describe('formatPrice', () => {
  it('formats price in UZS', () => {
    expect(formatPrice(45000)).toBe('45 000 сум')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0 сум')
  })

  it('handles large numbers', () => {
    expect(formatPrice(1_500_000)).toBe('1 500 000 сум')
  })
})
