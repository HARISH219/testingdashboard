import { Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

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
          "relative grid place-items-center rounded-xl bg-gradient-to-br from-arctic/30 to-primary/10 border border-white/10 shadow-glow-sm",
          dims
        )}
      >
        <Snowflake className="size-1/2 text-arctic" />
      </div>
      {showText && (
        <span className={cn("font-display font-bold tracking-tight text-snow", text)}>
          Snowy
        </span>
      )}
    </div>
  );
}
