/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit } from '../lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    // Reset internal state by calling with unique keys
  })

  it('allows requests within limit', () => {
    const key = 'test-1'
    expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(true)
  })

  it('blocks requests over limit', () => {
    const key = 'test-2'
    expect(rateLimit(key, 2, 60_000)).toBe(true)
    expect(rateLimit(key, 2, 60_000)).toBe(true)
    expect(rateLimit(key, 2, 60_000)).toBe(false)
  })

  it('treats different keys independently', () => {
    const keyA = 'test-a'
    const keyB = 'test-b'
    expect(rateLimit(keyA, 1, 60_000)).toBe(true)
    expect(rateLimit(keyA, 1, 60_000)).toBe(false)
    expect(rateLimit(keyB, 1, 60_000)).toBe(true)
  })
})
