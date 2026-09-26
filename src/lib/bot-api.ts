import { env, HAS_BOT_API } from "./env";

/**
 * Client for the Snowy bot's internal HTTP API.
 *
 * This is the real integration surface between the dashboard and the Discord
 * bot (discord.js service). The bot exposes authenticated endpoints; the
 * dashboard calls them with a shared secret. When the bot API is not
 * configured, calls return { ok: false, pending: true } so the UI can show a
 * clear "pending integration" state instead of pretending success.
 */

export interface BotApiResult<T = unknown> {
  ok: boolean;
  pending?: boolean; // bot API not configured yet
  data?: T;
  error?: string;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<BotApiResult<T>> {
  if (!HAS_BOT_API) {
    return { ok: false, pending: true, error: "Bot API not configured" };
  }
  try {
    const res = await fetch(`${env.BOT_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.BOT_API_SECRET}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Bot API ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const botApi = {
  getStatus: (guildId: string) => call<{ online: boolean; latencyMs: number }>(`/guilds/${guildId}/status`),
  runModAction: (guildId: string, payload: unknown) =>
    call(`/guilds/${guildId}/moderation`, { method: "POST", body: JSON.stringify(payload) }),
  syncConfig: (guildId: string, module: string, data: unknown) =>
    call(`/guilds/${guildId}/config/${module}`, { method: "PUT", body: JSON.stringify(data) }),
  /**
   * Ask the bot to send a message/embed to a channel. Used for actions the
   * dashboard cannot perform itself (it has no gateway and never holds the bot
   * token). Returns the created message id when the bot service is configured.
   */
  sendMessage: (
    guildId: string,
    payload: { channelId: string; content?: string; embed?: unknown; components?: unknown }
  ) => call<{ messageId: string; channelId: string }>(`/guilds/${guildId}/messages`, { method: "POST", body: JSON.stringify(payload) }),
  /**
   * Send a notification embed to a fixed internal Soward channel (e.g. premium
   * purchase alerts). The bot resolves the channel by id server-side.
   */
  sendInternalNotification: (payload: { channelId: string; embed: unknown }) =>
    call<{ messageId: string }>(`/internal/notify`, { method: "POST", body: JSON.stringify(payload) }),
};
