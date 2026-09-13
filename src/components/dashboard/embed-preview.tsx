"use client";

/** Discord-style embed / message preview used by welcome, goodbye, booster, etc. */
export function MessagePreview({
  username = "NewMember",
  content,
  embed,
}: {
  username?: string;
  content?: string;
  embed?: { title?: string; description?: string; color?: string; image?: string };
}) {
  const render = (text?: string) =>
    (text ?? "")
      .replace(/\{user\}/g, `@${username}`)
      .replace(/\{username\}/g, username)
      .replace(/\{server\}/g, "Winterfell Community")
      .replace(/\{membercount\}/g, "1,284");

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#313338] p-4 text-sm">
      <div className="flex gap-3">
        <div className="size-10 shrink-0 rounded-full bg-arctic/30" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-arctic">Snowy</span>
            <span className="rounded bg-arctic/20 px-1 text-[10px] font-semibold text-arctic">APP</span>
            <span className="text-[11px] text-white/40">Today</span>
          </div>
          {content && <p className="mt-0.5 whitespace-pre-wrap text-white/90">{render(content)}</p>}
          {embed && (embed.title || embed.description) && (
            <div
              className="mt-1.5 max-w-md rounded border-l-4 bg-[#2b2d31] p-3"
              style={{ borderColor: embed.color || "#9EDCFF" }}
            >
              {embed.title && <p className="font-semibold text-white">{render(embed.title)}</p>}
              {embed.description && (
                <p className="mt-1 whitespace-pre-wrap text-white/80">{render(embed.description)}</p>
              )}
              {embed.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={embed.image} alt="" className="mt-2 max-h-40 rounded object-cover" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const VARIABLES = [
  { token: "{user}", desc: "Mentions the member" },
  { token: "{username}", desc: "The member's name" },
  { token: "{server}", desc: "Your server name" },
  { token: "{membercount}", desc: "Current member count" },
];
