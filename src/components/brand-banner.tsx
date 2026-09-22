import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/**
 * Optional brand banner. Renders nothing unless BRAND.bannerUrl is set
 * (via NEXT_PUBLIC_BRAND_BANNER_URL or by editing lib/brand.ts), so the
 * banner is entirely optional as requested.
 */
export function BrandBanner({ className }: { className?: string }) {
  if (!BRAND.bannerUrl) return null;
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/[0.08] shadow-glass",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND.bannerUrl}
        alt={`${BRAND.name} banner`}
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
    </div>
  );
}
