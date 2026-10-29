/*
 * Best-effort sliding-window throttle, keyed by whatever the caller passes (usually the
 * client IP — see clientIp below for when that can be trusted). It lives in this server
 * instance's memory, so on serverless it resets on cold starts and is not shared between
 * instances: each instance counts separately, so the real ceiling is the limit times the
 * number of warm instances. It stops a single client hammering an endpoint, not a
 * distributed flood. A shared store (e.g. Upstash) is the upgrade path if that ever matters;
 * until then the admin password length requirement (12+) is what actually protects login.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  const recent = (key: string, now: number) =>
    (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  return {
    /** Seconds until `key` may try again, or 0 if it is under the limit right now. */
    retryAfter(key: string): number {
      const now = Date.now();
      const times = recent(key, now);
      hits.set(key, times);
      if (times.length < limit) return 0;
      return Math.max(1, Math.ceil((times[0] + windowMs - now) / 1000));
    },

    record(key: string) {
      const now = Date.now();
      const times = recent(key, now);
      times.push(now);
      hits.set(key, times);

      // Keep the map from growing without bound on a long-lived instance.
      if (hits.size > 5000) {
        for (const [k, t] of hits) {
          if (t.every((stamp) => now - stamp >= windowMs)) hits.delete(k);
        }
      }
    },

    reset(key: string) {
      hits.delete(key);
    },
  };
}

/*
 * x-forwarded-for is just a request header: any client can send one. It is only the real
 * client address when a proxy we control overwrites it. Vercel does (VERCEL is set
 * there); behind your own reverse proxy, set TRUST_PROXY=1 to say the same.
 *
 * Anywhere else the header is ignored and every caller shares one bucket. That is the safe
 * failure: spoofed headers can't mint fresh buckets to dodge the limit (they could before —
 * eight fake addresses sailed past a limit of five), at the price that the limit becomes
 * global. A shared bucket still stops guessing; it just also counts real visitors together.
 */
const TRUST_FORWARDED_FOR = Boolean(process.env.VERCEL) || process.env.TRUST_PROXY === '1';

export function clientIp(req: Request): string {
  if (!TRUST_FORWARDED_FOR) return 'untrusted-network';
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
