const NAMESPACE = 'vcorp-hrms'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function storageKey(key: string) {
  return `${NAMESPACE}:${key}`
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(storageKey(key))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return
  window.localStorage.setItem(storageKey(key), JSON.stringify(value))
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return
  window.localStorage.removeItem(storageKey(key))
}

export function clearAllAppStorage(): void {
  if (!isBrowser()) return
  const keysToRemove: Array<string> = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)
    if (k && k.startsWith(`${NAMESPACE}:`)) keysToRemove.push(k)
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k))
}

/** Simulates realistic network latency so loading states are visible. */
export function simulateLatency(minMs = 250, maxMs = 550): Promise<void> {
  const ms = Math.round(minMs + Math.random() * (maxMs - minMs))
  return new Promise((resolve) => setTimeout(resolve, ms))
}
