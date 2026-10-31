import { createClient } from '@supabase/supabase-js';

// In-memory L1 cache (hot layer)
const memCache = new Map();
const MEM_TTL = 5 * 60 * 1000; // 5 min

let supabase = null;
function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

/**
 * Get a cached value. Returns null if missing or expired.
 * @param {string} key
 */
export async function cacheGet(key) {
  // L1: memory
  const mem = memCache.get(key);
  if (mem && mem.expires > Date.now()) return mem.value;
  memCache.delete(key);

  // L2: Supabase
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('cache')
    .select('value, expires_at')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  // Warm L1
  memCache.set(key, { value: data.value, expires: Date.now() + MEM_TTL });
  return data.value;
}

/**
 * Store a value in both cache layers.
 * @param {string} key
 * @param {unknown} value  (JSON-serialisable)
 * @param {number} ttlMs   time-to-live in milliseconds
 */
export async function cacheSet(key, value, ttlMs = 60 * 60 * 1000) {
  // L1
  memCache.set(key, { value, expires: Date.now() + Math.min(ttlMs, MEM_TTL) });

  // L2
  const sb = getSupabase();
  if (!sb) return;

  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  await sb.from('cache').upsert({ key, value, expires_at: expiresAt });
}

/**
 * Build a deterministic cache key.
 */
export function makeCacheKey(...parts) {
  return parts.map(String).join(':');
}
