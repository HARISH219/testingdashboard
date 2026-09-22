import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Privacy Policy — Soward" };

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-16">
      <Link href="/"><Logo className="mb-10" /></Link>
      <h1 className="font-display text-3xl font-bold text-snow">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Placeholder document for local development.</p>
      <div className="prose prose-invert mt-8 space-y-4 text-frost">
        <p>Soward stores only the data required to provide the dashboard: your Discord user id, username, avatar, and the guilds you can manage. Access tokens are kept in a secure server-side session and never exposed to the browser.</p>
        <p>We do not sell your data. Server configuration is retained according to your configured retention policy. You may request deletion of your account and associated data at any time.</p>
        <p>This is placeholder legal text. Replace it with your production policy before launch.</p>
      </div>
    </div>
  );
}
