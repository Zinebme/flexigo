/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments and all development. For
 * multi-instance production put the same logic behind a shared store
 * (e.g. Upstash/Redis) — the interface is intentionally small so the
 * implementation can be swapped without touching call sites.
 */

type WindowEntry = { hits: number[] };

const store = new Map<string, WindowEntry>();
const MAX_KEYS = 20_000;
let lastCleanup = 0;

function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    while (entry.hits.length > 0 && entry.hits[0]! < now - 10 * 60 * 1000) entry.hits.shift();
    if (entry.hits.length === 0) store.delete(key);
  }
  if (store.size > MAX_KEYS) {
    const excess = store.size - MAX_KEYS;
    let i = 0;
    for (const key of store.keys()) {
      if (i++ >= excess) break;
      store.delete(key);
    }
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

/**
 * Record a hit for `key`. Returns whether the request is allowed.
 */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);
  let entry = store.get(key);
  if (!entry) {
    entry = { hits: [] };
    store.set(key, entry);
  }
  while (entry.hits.length > 0 && entry.hits[0]! < now - windowMs) entry.hits.shift();
  if (entry.hits.length >= limit) {
    const oldest = entry.hits[0]!;
    return { ok: false, retryAfterMs: Math.max(1000, windowMs - (now - oldest)) };
  }
  entry.hits.push(now);
  return { ok: true, remaining: limit - entry.hits.length };
}

/** Extract the best-guess client IP from request headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().toLowerCase();
  return headers.get("x-real-ip")?.toLowerCase() ?? "unknown";
}

/** Test helper — clear all buckets. */
export function __resetRateLimitsForTests() {
  store.clear();
  lastCleanup = 0;
}
