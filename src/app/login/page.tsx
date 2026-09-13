"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/snowfall";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { status } = useSession();
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/servers");
  }, [status, router]);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("discord", { callbackUrl: "/servers" });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      <Snowfall density={60} className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-arctic/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-8 text-center shadow-glass">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="font-display text-2xl font-bold text-snow">Welcome to Snowy</h1>
          <p className="mt-2 text-sm text-frost">
            Sign in with Discord to manage your servers.
          </p>

          {params.get("error") && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Sign in failed. Please try again.
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            variant="discord"
            size="lg"
            className="mt-6 w-full"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <DiscordIcon className="size-5" />
            )}
            Continue with Discord
          </Button>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            Secure OAuth2. We only store what we need.
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="text-arctic hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-arctic hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-snow">
            ← Back to home
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <Link href="/setup" className="text-muted-foreground hover:text-snow">
            Setup status
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
