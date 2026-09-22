/**
 * Central brand configuration. Change the bot's public name here and it
 * updates everywhere the UI reads from BRAND.
 */
export const BRAND = {
  name: "Soward",
  tagline: "Your Discord server, beautifully under control.",
  description:
    "Soward brings powerful moderation, music, security, automation, and community tools into one beautifully simple dashboard.",
  // Optional artwork. Provide URLs (or /public paths) to show real assets.
  // The logo falls back to the snowflake mark when logoUrl is empty, and the
  // banner is only rendered when bannerUrl is set (banner is optional).
  logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL ?? "",
  bannerUrl: process.env.NEXT_PUBLIC_BRAND_BANNER_URL ?? "",
} as const;
