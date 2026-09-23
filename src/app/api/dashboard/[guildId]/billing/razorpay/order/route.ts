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
  // INR by default — Razorpay test accounts are typically INR-only and reject
  // other currencies. Plan prices are stored in USD and converted below.
  currency: z.string().length(3).default("INR"),
});

// Approximate USD→INR rate used to bill INR-only Razorpay accounts. Adjust or
// move to config if you want live rates.
const USD_TO_INR = 84;

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
  const priceUsd = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  // Convert to the target currency, then to the smallest unit (paise/cents).
  const priceInCurrency = currency.toUpperCase() === "INR" ? priceUsd * USD_TO_INR : priceUsd;
  const amount = Math.round(priceInCurrency * 100);

  // Razorpay requires a minimum of 100 (₹1 / $1) in the smallest unit.
  if (amount < 100) {
    return NextResponse.json({ error: "Amount is below the minimum of 100." }, { status: 400 });
  }

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
    const msg = (e as Error).message;
    // Razorpay returns 401 "authentication failed" when the key id/secret pair
    // is wrong or the secret is missing. Give an actionable message.
    const authFailure = /authentication|401|unauthor/i.test(msg);
    return NextResponse.json(
      {
        error: authFailure
          ? "Razorpay rejected the API credentials. Check that RAZORPAY_KEY_SECRET matches your Key ID (and is set in Vercel)."
          : msg,
      },
      // 401 for credential problems, 500 for other Razorpay/API errors.
      { status: authFailure ? 401 : 500 }
    );
  }
}
