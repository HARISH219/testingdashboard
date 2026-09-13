import { NextRequest, NextResponse } from "next/server";
import { authorizeGuild } from "@/lib/authz";
import { stripe, HAS_STRIPE } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { env, HAS_DATABASE } from "@/lib/env";

/** Open the Stripe billing portal for the guild's subscription. */
export async function POST(_req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  if (!HAS_STRIPE || !stripe) {
    return NextResponse.json({ configured: false, message: "Stripe is not configured." });
  }

  let customerId: string | undefined;
  if (HAS_DATABASE) {
    const user = await prisma.user.findUnique({ where: { discordId: authz.user.discordId } });
    customerId = user?.stripeCustomerId ?? undefined;
  }
  if (!customerId) {
    return NextResponse.json({ configured: true, message: "No billing account yet. Subscribe first." }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXTAUTH_URL}/dashboard/${params.guildId}/billing`,
  });
  return NextResponse.json({ configured: true, url: session.url });
}
