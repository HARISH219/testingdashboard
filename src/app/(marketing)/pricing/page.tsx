import Link from "next/link";
import { Logo } from "@/components/logo";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Pricing — Snowy" };

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="container flex h-20 items-center justify-between">
        <Link href="/"><Logo /></Link>
        <Button asChild variant="secondary" size="sm"><Link href="/login">Login</Link></Button>
      </header>
      <main className="container py-12">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold text-snow">Simple, transparent pricing</h1>
          <p className="mt-4 text-frost">Start free. Upgrade when your community grows.</p>
        </div>
        <PricingCards />
      </main>
    </div>
  );
}
