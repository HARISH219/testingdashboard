import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/authz";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/servers");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={26} className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-40" />
      <header className="relative z-10 border-b border-white/[0.06] bg-navy/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge>Admin</Badge>
          </div>
          <Link href="/servers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-snow">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
        </div>
      </header>
      <main className="container relative z-10 py-8">{children}</main>
    </div>
  );
}
