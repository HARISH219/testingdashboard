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
  const [problem, setProblem] = React.useState<string | null>(null);
  const [discordReady, setDiscordReady] = React.useState<boolean | null>(null);
  const [redirectUri, setRedirectUri] = React.useState("");

  React.useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/auth/callback/discord`);
  }, []);

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/servers");
  }, [status, router]);

  // Confirm the Discord provider actually exists on this deployment. If the
  // server is missing NEXTAUTH_SECRET / Discord credentials it falls back to
  // demo mode, where "discord" is not a registered provider and signIn() would
  // do nothing at all. Surfacing that here beats a button that silently fails.
  React.useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((providers) => {
        const ok = Boolean(providers && providers.discord);
        setDiscordReady(ok);
        if (!ok) {
          setProblem(
            "Discord sign-in isn't configured on this deployment. The server is missing NEXTAUTH_SECRET or the Discord credentials."
          );
        }
      })
      .catch(() =>
        setProblem("Couldn't reach the authentication server. Is it running?")
      );
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setProblem(null);
    try {
      // redirect:false so a failure surfaces here instead of vanishing.
      const res = await signIn("discord", {
        callbackUrl: "/servers",
        redirect: false,
      });
      if (!res) {
        setProblem("Sign-in didn't start. The Discord provider may not be configured.");
        return;
      }
      if (res.error) {
        setProblem(`Discord rejected the sign-in: ${res.error}`);
        return;
      }
      if (res.url) {
        window.location.href = res.url;
        return;
      }
      setProblem("Sign-in returned no redirect URL.");
    } catch (e) {
      setProblem((e as Error).message || "Unexpected error starting sign-in.");
    } finally {
      setLoading(false);
    }
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
            <Logo size="lg" />
          </div>
          <h1 className="font-display text-2xl font-bold text-snow">Welcome to Soward</h1>
          <p className="mt-2 text-sm text-frost">
            Sign in with Discord to manage your servers.
          </p>

          {params.get("error") && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive">
              <p className="font-medium">Sign in failed: {params.get("error")}</p>
              <p className="mt-1 text-destructive/90">
                If Discord reported an invalid redirect, add this URI under OAuth2 →
                Redirects:
              </p>
              <code className="mt-2 block break-all rounded-lg bg-navy/60 p-2 font-mono text-xs text-arctic">
                {redirectUri}
              </code>
            </div>
          )}

          {problem && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-left text-sm text-warning">
              <p className="font-medium">Can&apos;t sign in</p>
              <p className="mt-1 text-warning/90">{problem}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading || discordReady === false}
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

        <div className="mt-6 flex items-center justify-center text-sm">
          <Link href="/" className="text-muted-foreground hover:text-snow">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
