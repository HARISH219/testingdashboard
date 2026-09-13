"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { userAvatarUrl } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const user = session?.user;
  if (!user) return null;
  const avatar = userAvatarUrl(user.discordId, user.avatar, "0", 128);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Snowfall density={30} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm"><Link href="/servers"><ArrowLeft className="size-4" /> Servers</Link></Button>
        </div>
      </header>

      <main className="container relative z-10 max-w-2xl py-12">
        <Card className="p-8">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" className="size-20 rounded-2xl border border-white/10" />
            <div>
              <h1 className="font-display text-2xl font-bold text-snow">{user.globalName ?? user.username}</h1>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <div className="mt-2 flex gap-2">
                {user.isAdmin && <Badge><Shield className="size-3" /> Snowy Admin</Badge>}
                <Badge variant="secondary" className="font-mono">{user.discordId}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {user.isAdmin && (
              <Button asChild variant="secondary" className="w-full justify-start"><Link href="/admin"><Shield className="size-4" /> Open admin dashboard</Link></Button>
            )}
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
