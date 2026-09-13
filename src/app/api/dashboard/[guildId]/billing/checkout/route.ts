import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild } from "@/lib/authz";
import { stripe, HAS_STRIPE } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { env, HAS_DATABASE } from "@/lib/env";
import { PLANS, type PlanTier } from "@/lib/plans";

const schema = z.object({
  tier: z.enum(["PREMIUM", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

/**
 * Create a Stripe Checkout session for a guild subscription.
 * If Stripe is not configured, returns a clear "not configured" response so
 * the UI can explain the pending integration instead of faking success.
 */
export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  // Only owners can manage billing.
  if (!authz.guild.owner && !authz.user.isAdmin) {
    return NextResponse.json({ error: "Only the server owner can manage billing." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { tier, interval } = parsed.data;

  if (!HAS_STRIPE || !stripe) {
    return NextResponse.json({
      configured: false,
      message: "Stripe is not configured. Add STRIPE_SECRET_KEY and price IDs to enable live checkout.",
    });
  }

  // Resolve a Stripe price: prefer admin-configured PlanConfig, fall back to
  // creating an ad-hoc price from the built-in placeholder amounts.
  let priceId: string | undefined;
  if (HAS_DATABASE) {
    const cfg = await prisma.planConfig.findUnique({ where: { tier: tier as PlanTier } });
    priceId = interval === "yearly" ? cfg?.stripePriceYearlyId ?? undefined : cfg?.stripePriceMonthlyId ?? undefined;
  }

  const plan = PLANS[tier];
  const amount = Math.round((interval === "yearly" ? plan.priceYearly : plan.priceMonthly) * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: { name: `Snowy ${plan.name} (${authz.guild.name})` },
              recurring: { interval: interval === "yearly" ? "year" : "month" },
              unit_amount: amount,
            },
            quantity: 1,
          },
    ],
    metadata: { guildId: params.guildId, tier, userId: authz.user.discordId },
    success_url: `${env.NEXTAUTH_URL}/dashboard/${params.guildId}/billing?success=1`,
    cancel_url: `${env.NEXTAUTH_URL}/dashboard/${params.guildId}/billing?canceled=1`,
  });

  return NextResponse.json({ configured: true, url: session.url });
}
