import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Snowy — Your Discord server, beautifully under control.",
  description:
    "Snowy brings powerful moderation, music, security, automation, and community tools into one beautifully simple dashboard.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Inter is loaded at runtime rather than through next/font/google so the
          production build has no network dependency. A build must never fail
          because a font CDN was slow. globals.css defines a full system-font
          fallback stack, so the UI renders correctly even if this never loads.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
