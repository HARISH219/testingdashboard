/**
 * Giveaway embed templates + a preset image library.
 *
 * Templates give the giveaway embed a ready-made look (title style, accent
 * color, default emoji). Preset images are curated banner URLs the user can
 * pick with one click instead of pasting a URL — a custom URL is still allowed.
 */

export interface GiveawayTemplate {
  key: string;
  name: string;
  /** Emoji/prefix shown in the embed title. */
  emoji: string;
  /** Default accent color for this template. */
  color: string;
  /** Suggested title, supports {prize}. */
  title: string;
  /** Suggested description, supports {prize} {winners} {ends} {host}. */
  description: string;
}

export const GIVEAWAY_TEMPLATES: GiveawayTemplate[] = [
  {
    key: "classic",
    name: "Classic",
    emoji: "🎉",
    color: "#3B82F6",
    title: "🎉 GIVEAWAY 🎉",
    description: "React with 🎉 to enter!\n\n**Prize:** {prize}\n**Winners:** {winners}\n**Ends:** {ends}",
  },
  {
    key: "premium",
    name: "Premium",
    emoji: "💎",
    color: "#8B5CF6",
    title: "💎 PREMIUM GIVEAWAY",
    description: "A special prize is up for grabs!\n\n🎁 **{prize}**\n🏆 {winners} winner(s)\n⏰ Ends {ends}",
  },
  {
    key: "gaming",
    name: "Gaming",
    emoji: "🎮",
    color: "#22C55E",
    title: "🎮 GAME DROP",
    description: "GG! Enter for a chance to win.\n\n**Loot:** {prize}\n**Winners:** {winners}\n**Closes:** {ends}",
  },
  {
    key: "festive",
    name: "Festive",
    emoji: "🎄",
    color: "#EF4444",
    title: "🎄 HOLIDAY GIVEAWAY",
    description: "'Tis the season to win!\n\n🎁 {prize}\n👑 {winners} lucky winner(s)\n🕛 Ends {ends}",
  },
  {
    key: "minimal",
    name: "Minimal",
    emoji: "✨",
    color: "#9CA3AF",
    title: "Giveaway: {prize}",
    description: "{winners} winner(s) · ends {ends}",
  },
];

export const TEMPLATE_MAP: Record<string, GiveawayTemplate> = Object.fromEntries(
  GIVEAWAY_TEMPLATES.map((t) => [t.key, t])
);

export function getTemplate(key: string): GiveawayTemplate {
  return TEMPLATE_MAP[key] ?? GIVEAWAY_TEMPLATES[0];
}

/** Curated banner images the user can select for the giveaway embed. */
export interface PresetImage {
  key: string;
  name: string;
  url: string;
}

export const PRESET_IMAGES: PresetImage[] = [
  { key: "confetti", name: "Confetti", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=70" },
  { key: "gift", name: "Gifts", url: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=70" },
  { key: "celebrate", name: "Celebrate", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=70" },
  { key: "neon", name: "Neon", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=70" },
  { key: "gold", name: "Gold", url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&q=70" },
  { key: "party", name: "Party", url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70" },
];

/** Render a template's description with giveaway values substituted. */
export function renderGiveawayDescription(
  tpl: GiveawayTemplate,
  vars: { prize: string; winners: number; ends: string; host?: string }
): string {
  return tpl.description
    .replace(/\{prize\}/g, vars.prize || "a prize")
    .replace(/\{winners\}/g, String(vars.winners))
    .replace(/\{ends\}/g, vars.ends)
    .replace(/\{host\}/g, vars.host ?? "the staff");
}
