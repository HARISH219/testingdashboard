"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { CosmicBackground } from "@/components/cosmic-background";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* One global cosmic background for every route. Mounted here (outside the
          page tree) so it persists across navigation and never reloads/jumps. */}
      <CosmicBackground />
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
