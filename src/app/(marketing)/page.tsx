"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Snowflake, LayoutDashboard, BookOpenText } from "lucide-react";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { DiscordIcon } from "@/components/icons";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={70} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />

      {/* Shared navigation */}
      <MarketingHeader />

      {/* Hero */}
      <section className="relative z-10">
        <div className="container pb-16 pt-10 text-center md:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
              <Sparkles className="size-3 text-arctic" />
              Premium Discord management, beautifully simple
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-4xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-snow sm:text-5xl md:text-6xl"
          >
            Your Discord server,{" "}
            <span className="text-gradient-arctic">beautifully under control.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-frost"
          >
            Snowy brings powerful moderation, music, security, automation, and community
            tools into one beautifully simple dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:items-center sm:justify-center"
          >
            <Button asChild size="lg" variant="discord" className="w-full sm:w-auto">
              <Link href="/login">
                <DiscordIcon className="size-5" /> Login with Discord
              </Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/servers">
                <LayoutDashboard className="size-5" /> Open Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <Link href="/commands">
                <BookOpenText className="size-5" /> Commands
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="w-full sm:w-auto">
              <a href="#pricing">View Pricing</a>
            </Button>
          </motion.div>

          <div className="mt-16">
            <DashboardPreview />
          </div>
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
            <Snowfall density={30} className="pointer-events-none absolute inset-0 opacity-60" />
            <Snowflake className="mx-auto mb-5 size-10 text-arctic animate-float" />
            <h2 className="relative font-display text-3xl font-bold text-snow sm:text-4xl">
              Bring a little more order to your server.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-frost">
              Powerful moderation. Beautifully simple. Get started with Snowy in minutes.
            </p>
            <Button asChild size="lg" className="relative mt-8">
              <Link href="/login">
                Get Started with Snowy <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} Snowy. Your Discord server, beautifully under control.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-snow">Privacy</Link>
            <Link href="/terms" className="hover:text-snow">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
