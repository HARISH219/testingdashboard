"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { CosmicBackground } from "@/components/cosmic-background";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* Global cosmic background — fixed BEHIND everything, never clickable. */}
      <CosmicBackground />
      {/* All app content sits in a positioned layer above the background so it
          is always interactive regardless of the background's stacking. */}
      <div className="relative z-10">
        <ToastProvider>{children}</ToastProvider>
      </div>
    </SessionProvider>
  );
}
