import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeGuild } from "@/lib/authz";
import { createOrder, publicKeyId, HAS_RAZORPAY } from "@/lib/razorpay";
import { PLANS, type PlanTier } from "@/lib/plans";

/**
 * Create a Razorpay order for a guild subscription. Owner-gated. Returns the
 * order id + public key id the frontend needs to open the checkout widget.
 * If Razorpay isn't fully configured (missing Key Secret), returns
 * { configured: false } so the UI can explain instead of faking success.
 */

const schema = z.object({
  tier: z.enum(["PREMIUM", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
  currency: z.string().length(3).default("USD"),
});

export async function POST(req: NextRequest, { params }: { params: { guildId: string } }) {
  const authz = await authorizeGuild(params.guildId);
  if (!authz) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!authz.guild.owner && !authz.user.isAdmin) {
    return NextResponse.json({ error: "Only the server owner can manage billing." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { tier, interval, currency } = parsed.data;

  if (!HAS_RAZORPAY) {
    return NextResponse.json({
      configured: false,
      message: "Razorpay is not fully configured. Add RAZORPAY_KEY_SECRET to enable checkout.",
    });
  }

  const plan = PLANS[tier as PlanTier];
  const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  // Razorpay expects the amount in the smallest currency unit (paise/cents).
  const amount = Math.round(price * 100);

  try {
    const order = await createOrder({
      amount,
      currency,
      receipt: `soward_${params.guildId}_${tier}_${Date.now()}`.slice(0, 40),
      notes: { guildId: params.guildId, tier, interval, userId: authz.user.discordId },
    });
    return NextResponse.json({
      configured: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
      tier,
      interval,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
