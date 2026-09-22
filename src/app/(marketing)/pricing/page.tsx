import { PricingCards } from "@/components/marketing/pricing-cards";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Snowfall } from "@/components/snowfall";

export const metadata = { title: "Pricing — Soward" };

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={30} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-50" />
      <MarketingHeader />
      <main className="container relative z-10 py-10 sm:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-arctic">Pricing</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-snow sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-frost">Start free. Upgrade when your community grows.</p>
        </div>
        <PricingCards />
      </main>
    </div>
  );
}
