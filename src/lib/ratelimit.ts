import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

function makeLimiter(requests: number, window: `${number} s` | `${number} m` | `${number} h`) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window) });
}

// Unauthenticated AI endpoints — tight limits, IP-keyed
export const generatePlanLimiter = makeLimiter(5, "1 h");   // 5 plans per IP per hour
export const healthScoreLimiter  = makeLimiter(10, "1 h");  // 10 scores per IP per hour

// Authenticated write endpoints — per user ID
export const commitLimiter  = makeLimiter(10, "1 h");  // 10 commits per user per hour
export const checkInLimiter = makeLimiter(20, "1 h");  // 20 check-ins per user per hour

/**
 * Checks the rate limiter for the given key.
 * Returns a 429 Response if the limit is exceeded, null if allowed.
 * If Upstash is not configured, skips silently.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<Response | null> {
  if (!limiter) return null;

  const { success, limit, remaining, reset } = await limiter.limit(key);
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

/** Extract the best available IP from a Next.js Request. */
export function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
