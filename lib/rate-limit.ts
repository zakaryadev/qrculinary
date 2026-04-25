const rateMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number = 10, windowMs: number = 60_000): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

// Prevent memory leak — clean stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(key)
    }
  }, 300_000)
}
