"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = React.useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", !yearly && "text-snow", yearly && "text-muted-foreground")}>
          Monthly
        </span>
        <button
          onClick={() => setYearly((y) => !y)}
          className="relative h-7 w-12 rounded-full border border-white/10 bg-white/[0.06] transition-colors"
          aria-label="Toggle yearly billing"
        >
          <span
            className={cn(
              "absolute top-1 size-5 rounded-full bg-arctic transition-transform",
              yearly ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span className={cn("text-sm", yearly && "text-snow", !yearly && "text-muted-foreground")}>
          Yearly <Badge variant="success" className="ml-1">Save ~17%</Badge>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((tier, i) => {
          const plan = PLANS[tier];
          const price = yearly ? plan.priceYearly : plan.priceMonthly;
          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  "relative h-full p-6",
                  plan.highlighted && "border-arctic/40 shadow-glow"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-6">
                    <Sparkles className="size-3" /> Most popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold text-snow">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-4xl font-bold text-snow">
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="mb-1 text-sm text-muted-foreground">
                      /{yearly ? "yr" : "mo"}
                    </span>
                  )}
                </div>
                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "secondary"}
                  className="mt-5 w-full"
                >
                  <Link href="/login">
                    {tier === "FREE" ? "Get started" : `Choose ${plan.name}`}
                  </Link>
                </Button>
                {!compact && (
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-frost">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices shown are placeholders and configurable from the admin panel.
      </p>
    </div>
  );
}
