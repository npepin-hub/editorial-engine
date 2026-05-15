import { Mastra } from "@mastra/core/mastra";
import { Redis } from "@upstash/redis";
import { changelogAgent } from "./agents/changelogAgent";
import { distillAgent } from "./agents/distillAgent";
import { communityAgent } from "./agents/communityAgent";
import { gapAgent } from "./agents/gapAgent";
import { competitorsAgent } from "./agents/competitorsAgent";
import { editorialAgent } from "./agents/editorialAgent";

let _redis: Redis | null = null;
export function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

// Lazy proxy so Redis.fromEnv() is not called at module load time
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  }
});

export const mastra = new Mastra({
  agents: { changelogAgent, distillAgent, communityAgent, gapAgent, competitorsAgent, editorialAgent }
});
