import { Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "size-11" : size === "sm" ? "size-7" : "size-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-arctic/30 to-primary/10 shadow-glow-sm",
          dims
        )}
      >
        {BRAND.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={BRAND.logoUrl}
            alt={`${BRAND.name} logo`}
            className="size-full object-cover"
          />
        ) : (
          <Snowflake className="size-1/2 text-arctic" />
        )}
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight text-snow", text)}>
          {BRAND.name}
        </span>
      )}
    </div>
  );
}
