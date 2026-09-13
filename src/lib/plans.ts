/**
 * Subscription plans and feature gating.
 * Pricing is placeholder and intended to be overridable from the admin panel
 * (see PlanConfig in the database). These are the built-in defaults.
 */

export type PlanTier = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface PlanFeatureLimits {
  maxServers: number; // -1 = unlimited
  moderation: "basic" | "advanced";
  antinuke: boolean;
  automod: "limited" | "advanced";
  logging: "limited" | "advanced";
  music: "basic" | "enhanced";
  tickets: boolean;
  giveaways: boolean;
  customEmbeds: boolean;
  aiChatbot: boolean;
  aiImageGen: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  tagline: string;
  priceMonthly: number; // placeholder USD
  priceYearly: number;
  highlighted?: boolean;
  features: string[];
  limits: PlanFeatureLimits;
}

export const PLANS: Record<PlanTier, Plan> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    tagline: "Everything to get started.",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Basic moderation",
      "Basic welcome & goodbye",
      "Limited logging (3 types)",
      "Limited automod",
      "Basic music player",
      "Up to 1 server",
    ],
    limits: {
      maxServers: 1,
      moderation: "basic",
      antinuke: false,
      automod: "limited",
      logging: "limited",
      music: "basic",
      tickets: false,
      giveaways: false,
      customEmbeds: false,
      aiChatbot: false,
      aiImageGen: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  PREMIUM: {
    tier: "PREMIUM",
    name: "Premium",
    tagline: "For serious communities.",
    priceMonthly: 7.99,
    priceYearly: 79.99,
    highlighted: true,
    features: [
      "Advanced moderation",
      "Antinuke security",
      "Advanced automod",
      "Music enhancements & 24/7",
      "Full logging suite",
      "Tickets & giveaways",
      "Custom embeds",
      "AI chatbot",
      "Up to 5 servers",
    ],
    limits: {
      maxServers: 5,
      moderation: "advanced",
      antinuke: true,
      automod: "advanced",
      logging: "advanced",
      music: "enhanced",
      tickets: true,
      giveaways: true,
      customEmbeds: true,
      aiChatbot: true,
      aiImageGen: false,
      analytics: true,
      prioritySupport: false,
      customBranding: false,
    },
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Custom scale & support.",
    priceMonthly: 29.99,
    priceYearly: 299.99,
    features: [
      "Everything in Premium",
      "Unlimited servers",
      "AI image generation",
      "Advanced analytics",
      "Custom branding",
      "Priority & dedicated support",
      "Custom limits",
    ],
    limits: {
      maxServers: -1,
      moderation: "advanced",
      antinuke: true,
      automod: "advanced",
      logging: "advanced",
      music: "enhanced",
      tickets: true,
      giveaways: true,
      customEmbeds: true,
      aiChatbot: true,
      aiImageGen: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "PREMIUM", "ENTERPRISE"];

export function planRank(tier: PlanTier): number {
  return PLAN_ORDER.indexOf(tier);
}

/** Does a plan tier meet or exceed the required tier? */
export function planMeets(current: PlanTier, required: PlanTier): boolean {
  return planRank(current) >= planRank(required);
}
