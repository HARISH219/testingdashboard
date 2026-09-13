import { guildIconUrl, cn } from "@/lib/utils";

export function GuildIcon({
  id,
  name,
  icon,
  size = 48,
  className,
}: {
  id: string;
  name: string;
  icon: string | null;
  size?: number;
  className?: string;
}) {
  const url = guildIconUrl(id, icon, 128);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-xl object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-arctic/25 to-primary/10 border border-white/10 font-semibold text-arctic",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
