import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

/**
 * Mobile viewport. `maximumScale` is deliberately left unset so users can still
 * pinch-zoom — disabling that is an accessibility failure.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111F",
};

export const metadata: Metadata = {
  title: "Snowy — Your Discord server, beautifully under control.",
  description:
    "Snowy brings powerful moderation, music, security, automation, and community tools into one beautifully simple dashboard.",
  icons: { icon: "/favicon.svg" },
};

/**
 * Render every route on demand instead of prerendering at build time.
 *
 * Snowy is an authenticated dashboard: almost every page depends on the
 * session, the Discord API, or the database, so static prerendering buys
 * essentially nothing here. Disabling it removes the build-time export pass,
 * which is a class of deploy failure we simply do not need to risk.
 * Pages still render fast — they are server-rendered per request and cached
 * at the edge by the host.
 */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // No manual <head> element here: in the App Router it can break hydration,
    // which silently stops client event handlers (like the login button) from
    // binding. The Inter webfont is loaded from globals.css instead.
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
