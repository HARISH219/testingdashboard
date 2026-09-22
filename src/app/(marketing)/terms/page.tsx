import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Terms of Service — Soward" };

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-16">
      <Link href="/"><Logo className="mb-10" /></Link>
      <h1 className="font-display text-3xl font-bold text-snow">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Placeholder document for local development.</p>
      <div className="prose prose-invert mt-8 space-y-4 text-frost">
        <p>By using Soward you agree to use the service in accordance with Discord&apos;s Terms of Service and Community Guidelines. Premium features require an active subscription.</p>
        <p>Soward is provided &quot;as is&quot;. We aim for high availability but do not guarantee uninterrupted service. Destructive actions performed through the dashboard are your responsibility.</p>
        <p>This is placeholder legal text. Replace it with your production terms before launch.</p>
      </div>
    </div>
  );
}
