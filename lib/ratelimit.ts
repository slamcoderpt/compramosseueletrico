import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash env missing");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export const leadsRateLimit = (() => {
  let l: Ratelimit | null = null;
  return () => {
    if (!l) {
      l = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        prefix: "rl:leads",
      });
    }
    return l;
  };
})();

export const proposalActionRateLimit = (() => {
  let l: Ratelimit | null = null;
  return () => {
    if (!l) {
      l = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "rl:proposal-action",
      });
    }
    return l;
  };
})();
