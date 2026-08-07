import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

let cachedStore;
let warnedOnce = false;

const warn = (context, err) => {
  if (warnedOnce) return;
  warnedOnce = true;
  console.error(
    `Redis rate-limit store unavailable (${context}), continuing without distributed rate limiting: ${err.message}`
  );
};

/**
 * A shared Redis-backed rate-limit store, needed once this API runs as more
 * than one instance — express-rate-limit's built-in store only tracks hits
 * seen by the single process it lives in, so behind a load balancer each
 * instance would enforce its own separate limit. Only activates when
 * REDIS_URL is set; with no REDIS_URL (the default: one Render instance)
 * this returns undefined and callers omit `store` entirely, which is how
 * express-rate-limit selects its normal in-memory store — zero behavior
 * change for the common case.
 *
 * A Redis outage after this is wired in must never take the whole API down:
 * `sendCommand` swallows any Redis error and reports "no hits yet" instead
 * of throwing, so rate limiting fails OPEN (briefly unenforced) rather than
 * failing every single request with a 500.
 */
export function getRateLimitStore() {
  if (!process.env.REDIS_URL) return undefined;
  if (cachedStore) return cachedStore;

  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  client.on('error', (err) => warn('connection', err));

  cachedStore = new RedisStore({
    sendCommand: async (...args) => {
      try {
        return await client.call(...args);
      } catch (err) {
        warn('command', err);
        // Shape expected by rate-limit-redis's parser: [totalHits, ttlMs].
        // Reporting a single fresh hit is the safest lie here — it never
        // blocks a legitimate request just because Redis is unreachable.
        return [1, 1];
      }
    },
  });
  return cachedStore;
}
