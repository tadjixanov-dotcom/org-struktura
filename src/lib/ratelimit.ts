import "server-only";

type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __orgRateBuckets: Map<string, Bucket> | undefined;
}

function store() {
  if (!global.__orgRateBuckets) global.__orgRateBuckets = new Map();
  return global.__orgRateBuckets;
}

/**
 * Oddiy xotiradagi cheklovchi. Bitta instans doirasida ishlaydi —
 * login sahifasini avtomatik parol tanlashdan himoya qilish uchun yetarli.
 */
export function rateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const buckets = store();

  // Eskirgan yozuvlarni vaqti-vaqti bilan tozalaymiz
  if (buckets.size > 500) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false as const, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true as const, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}
