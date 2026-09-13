import { HAS_DATABASE } from "./env";
import { prisma } from "./db";
import { PLANS, type PlanTier, type PlanFeatureLimits } from "./plans";

/**
 * Resolve the active plan tier for a guild. Falls back to FREE.
 * In demo mode the primary demo guild is treated as PREMIUM so premium UI is
 * reviewable; others are FREE.
 */
export async function getGuildTier(guildId: string): Promise<PlanTier> {
  if (!HAS_DATABASE) {
    return guildId.endsWith("1") ? "PREMIUM" : "FREE";
  }
  const sub = await prisma.subscription.findUnique({ where: { guildId } });
  if (!sub) return "FREE";
  const active = sub.status === "ACTIVE" || sub.status === "TRIALING";
  return active ? (sub.tier as PlanTier) : "FREE";
}

export async function getGuildLimits(guildId: string): Promise<PlanFeatureLimits> {
  const tier = await getGuildTier(guildId);
  return PLANS[tier].limits;
}
