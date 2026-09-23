"use client";

import * as React from "react";
import { CreditCard, Check, Sparkles, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useGuild } from "@/components/dashboard/guild-context";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { PLANS, PLAN_ORDER, planRank, type PlanTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Razorpay Checkout is loaded on demand from their CDN.
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (resp: any) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BillingPage() {
  const guild = useGuild();
  const { toast } = useToast();
  const [yearly, setYearly] = React.useState(false);
  const [loading, setLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("success")) toast({ variant: "success", title: "Subscription active", description: "Thanks for upgrading Soward!" });
    if (p.get("canceled")) toast({ variant: "info", title: "Checkout canceled" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPortal = async () => {
    setLoading("portal");
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/billing/portal`, { method: "POST" });
      const d = await r.json();
      if (d.configured && d.url) { window.location.href = d.url; return; }
      toast({ variant: "info", title: "Billing portal", description: d.message });
    } catch (e) {
      toast({ variant: "error", title: "Failed", description: (e as Error).message });
    } finally { setLoading(null); }
  };

  // Razorpay checkout: create an order server-side, open the widget, then
  // verify the signature server-side before anything is granted.
  const payWithRazorpay = async (tier: PlanTier) => {
    setLoading(`rzp-${tier}`);
    try {
      const r = await fetch(`/api/dashboard/${guild.id}/billing/razorpay/order`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval: yearly ? "yearly" : "monthly" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not start checkout");
      if (!d.configured) {
        toast({ variant: "info", title: "Razorpay not configured", description: d.message });
        return;
      }
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay checkout.");

      const rzp = new window.Razorpay({
        key: d.keyId,
        order_id: d.orderId,
        amount: d.amount,
        currency: d.currency,
        name: "Soward",
        description: `${PLANS[tier].name} plan · ${guild.name}`,
        theme: { color: "#3B82F6" },
        // User closed the modal without paying.
        modal: {
          ondismiss: () => {
            toast({ variant: "info", title: "Checkout canceled" });
            setLoading(null);
          },
        },
        handler: async (resp: any) => {
          try {
            const v = await fetch(`/api/dashboard/${guild.id}/billing/razorpay/verify`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: resp.razorpay_order_id,
                paymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
                tier, interval: yearly ? "yearly" : "monthly",
              }),
            });
            const vd = await v.json();
            // Only celebrate once the backend confirms the payment was recorded
            // AND the subscription activated. A verified-but-unrecorded payment
            // (stage: "database") must NOT show "Payment Successful".
            if (v.ok && vd.success) {
              toast({
                variant: "success",
                title: "Payment successful",
                description: vd.alreadyProcessed
                  ? "This payment was already applied. Reloading…"
                  : `You're now on ${PLANS[tier].name}. Reloading…`,
              });
              setTimeout(() => window.location.reload(), 1200);
              return;
            }
            if (vd.stage === "database") {
              toast({
                variant: "error",
                title: "Couldn't activate Premium",
                description: "Payment received, but we couldn't activate your Premium plan yet. Please contact support.",
              });
              return;
            }
            throw new Error(vd.message ?? "Verification failed");
          } catch (e) {
            toast({ variant: "error", title: "Verification failed", description: (e as Error).message });
          }
        },
      });
      // Payment attempted but failed (declined card, etc.).
      rzp.on("payment.failed", (resp: any) => {
        toast({
          variant: "error",
          title: "Payment failed",
          description: resp?.error?.description ?? "Your payment could not be completed.",
        });
      });
      rzp.open();
    } catch (e) {
      toast({ variant: "error", title: "Checkout failed", description: (e as Error).message });
    } finally { setLoading(null); }
  };

  const current = PLANS[guild.tier];

  return (
    <div>
      <PageHeader
        title="Billing" icon={<CreditCard className="size-5" />}
        description="Manage your subscription and unlock premium features."
        actions={<Button variant="secondary" onClick={openPortal} disabled={loading === "portal"}><ExternalLink className="size-4" /> Billing portal</Button>}
      />

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{current.name} · {current.tagline}</CardDescription>
          </div>
          <Badge variant={guild.tier === "FREE" ? "secondary" : "default"} className="text-sm">{current.name}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {guild.tier === "FREE"
              ? "You're on the free plan. Upgrade any time — your configuration is preserved."
              : "Your subscription is active. Manage payment and invoices in the billing portal."}
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yearly ? "text-snow" : "text-muted-foreground")}>Monthly</span>
        <button onClick={() => setYearly((y) => !y)} className="relative h-7 w-12 rounded-full border border-white/10 bg-white/[0.06]" aria-label="Toggle yearly">
          <span className={cn("absolute top-1 size-5 rounded-full bg-arctic transition-transform", yearly ? "translate-x-6" : "translate-x-1")} />
        </button>
        <span className={cn("text-sm", yearly ? "text-snow" : "text-muted-foreground")}>Yearly <Badge variant="success" className="ml-1">Save ~17%</Badge></span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((tier) => {
          const plan = PLANS[tier];
          const price = yearly ? plan.priceYearly : plan.priceMonthly;
          const isCurrent = tier === guild.tier;
          const isDowngrade = planRank(tier) < planRank(guild.tier);
          return (
            <Card key={tier} className={cn("relative flex flex-col p-6", plan.highlighted && "border-arctic/40 shadow-glow")}>
              {plan.highlighted && <Badge className="absolute -top-3 left-6"><Sparkles className="size-3" /> Most popular</Badge>}
              <h3 className="text-lg font-semibold text-snow">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-bold text-snow">{price === 0 ? "Free" : `$${price}`}</span>
                {price > 0 && <span className="mb-1 text-sm text-muted-foreground">/{yearly ? "yr" : "mo"}</span>}
              </div>
              {isCurrent ? (
                <Button variant="secondary" className="mt-4 w-full" disabled>Current plan</Button>
              ) : tier === "FREE" ? (
                <Button variant="outline" className="mt-4 w-full" onClick={openPortal}>{isDowngrade ? "Downgrade" : "Select"}</Button>
              ) : (
                <Button
                  className="mt-4 w-full"
                  onClick={() => payWithRazorpay(tier)}
                  disabled={loading === `rzp-${tier}`}
                >
                  {loading === `rzp-${tier}`
                    ? "Starting…"
                    : isDowngrade
                      ? "Switch plan"
                      : `Upgrade to ${plan.name}`}
                </Button>
              )}
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-frost"><Check className="mt-0.5 size-4 shrink-0 text-success" />{f}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Prices are placeholders and configurable from the admin panel. Cancel any time.</p>
    </div>
  );
}
