"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Crown, LayoutDashboard, BookOpenText } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Global cosmic background is mounted once in providers. */}
      <MarketingHeader />

      {/* Hero */}
      <section className="relative z-10">
        <div className="container flex flex-col items-center pb-16 pt-14 text-center md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="animate-badge-glow inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-frost backdrop-blur-md">
              <Crown className="size-3.5 text-arctic" />
              Premium Discord management, beautifully simple
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-7 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-snow sm:text-6xl md:text-7xl"
          >
            Your Discord server,
            <br />
            <span className="text-gradient-arctic drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]">
              beautifully under control.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-base text-frost sm:text-lg"
          >
            Soward brings powerful moderation, security, automation, music, and community
            tools into one beautifully simple dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-9 grid w-full max-w-sm grid-cols-1 gap-3 sm:flex sm:max-w-none sm:items-center sm:justify-center"
          >
            <Button asChild size="lg" className="glow-btn btn-shine w-full rounded-full sm:w-auto">
              <Link href="/servers">
                <LayoutDashboard className="size-5" /> Open Dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full rounded-full sm:w-auto">
              <Link href="/commands">
                <BookOpenText className="size-5" /> Commands
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full rounded-full sm:w-auto">
              <Link href="/pricing">View Pricing <ArrowRight className="size-4" /></Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-16 w-full"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-snow sm:text-4xl">
              Everything your server needs
            </h2>
            <p className="mt-4 text-frost">
              One dashboard for moderation, security, music, community, and automation.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-snow sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-frost">Start free. Upgrade when your community grows.</p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20">
        <div className="container">
          <div className="glass-strong relative overflow-hidden rounded-3xl px-8 py-16 text-center">
            <div className="pointer-events-none absolute -inset-x-10 -top-10 h-40 bg-arctic/10 blur-3xl" />
            <Crown className="relative mx-auto mb-5 size-10 text-arctic animate-float" />
            <h2 className="relative font-display text-3xl font-bold text-snow sm:text-4xl">
              Bring a little more order to your server.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-frost">
              Powerful moderation. Beautifully simple. Get started with Soward in minutes.
            </p>
            <Button asChild size="lg" className="glow-btn relative mt-8 rounded-full">
              <Link href="/servers">
                Open Dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Soward. Your Discord server, beautifully under control.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-snow">Privacy</Link>
            <Link href="/terms" className="hover:text-snow">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
