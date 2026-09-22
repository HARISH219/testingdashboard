import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Convert a Discord role color integer to a hex string. 0 = no color. */
export function intToHexColor(color: number | null | undefined, fallback = "#A9BBCB"): string {
  if (!color || color <= 0) return fallback;
  return "#" + color.toString(16).padStart(6, "0");
}

/** Discord guild icon URL */
export function guildIconUrl(id: string, icon: string | null, size = 128): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=${size}`;
}

export function userAvatarUrl(
  id: string,
  avatar: string | null,
  discriminator = "0",
  size = 128
): string {
  if (!avatar) {
    const idx = discriminator === "0" ? Number((BigInt(id) >> 22n) % 6n) : Number(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=${size}`;
}

/** Discord permission bit for MANAGE_GUILD */
export const PERMISSION = {
  ADMINISTRATOR: 1n << 3n,
  MANAGE_GUILD: 1n << 5n,
};

export function canManageGuild(permissions: string | number | bigint): boolean {
  const perms = BigInt(permissions);
  return (
    (perms & PERMISSION.ADMINISTRATOR) === PERMISSION.ADMINISTRATOR ||
    (perms & PERMISSION.MANAGE_GUILD) === PERMISSION.MANAGE_GUILD
  );
}
