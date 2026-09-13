import { NextRequest, NextResponse } from "next/server";
import { stripe, HAS_STRIPE } from "@/lib/stripe";
import { env, HAS_DATABASE } from "@/lib/env";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";
import type { PlanTier } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler with signature verification.
 * Keeps subscription state in sync. Never trusts unverified payloads.
 */
export async function POST(req: NextRequest) {
  if (!HAS_STRIPE || !stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${(e as Error).message}` }, { status: 400 });
  }

  if (!HAS_DATABASE) {
    // Acknowledge but note we can't persist without a database.
    return NextResponse.json({ received: true, persisted: false });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { guildId, tier, userId } = session.metadata ?? {};
        if (guildId && tier && userId) {
          const user = await prisma.user.upsert({
            where: { discordId: userId },
            create: { discordId: userId, username: userId, stripeCustomerId: session.customer as string },
            update: { stripeCustomerId: session.customer as string },
          });
          await prisma.subscription.upsert({
            where: { guildId },
            create: {
              guildId, userId: user.id, tier: tier as PlanTier, status: "ACTIVE",
              stripeSubscriptionId: session.subscription as string,
            },
            update: { tier: tier as PlanTier, status: "ACTIVE", stripeSubscriptionId: session.subscription as string },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const statusMap: Record<string, any> = {
          active: "ACTIVE", trialing: "TRIALING", past_due: "PAST_DUE",
          canceled: "CANCELED", unpaid: "EXPIRED", incomplete_expired: "EXPIRED",
        };
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: statusMap[sub.status] ?? "EXPIRED",
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
