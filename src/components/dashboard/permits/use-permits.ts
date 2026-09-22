"use client";

import * as React from "react";
import { useGuild } from "@/components/dashboard/guild-context";
import type { Permit } from "@/lib/permits";

export interface PermitActivity {
  id: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

/**
 * Parse a fetch Response as JSON without ever throwing "Unexpected end of JSON
 * input". If the body is empty or not JSON (e.g. a platform 500 with an HTML
 * error page), return a usable object with an error message instead.
 */
export async function safeJson(r: Response): Promise<any> {
  const text = await r.text().catch(() => "");
  if (!text) return { error: `Empty response (${r.status})` };
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Unexpected server response (${r.status})` };
  }
}

/**
 * Loads permits (and optionally recent activity) for the current guild from the
 * real /roles API. Handles loading + error state and exposes a reload().
 */
export function usePermits(withActivity = false) {
  const guild = useGuild();
  const [permits, setPermits] = React.useState<Permit[] | null>(null);
  const [activity, setActivity] = React.useState<PermitActivity[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    const qs = withActivity ? "?activity=1" : "";
    fetch(`/api/dashboard/${guild.id}/roles${qs}`)
      .then(async (r) => {
        const d = await safeJson(r);
        if (!r.ok) throw new Error(d.error ?? "Failed to load permits");
        return d;
      })
      .then((d) => {
        setPermits(d.permits ?? []);
        setActivity(d.activity ?? []);
        setError(null);
      })
      .catch((e) => {
        setPermits([]);
        setError((e as Error).message);
      });
  }, [guild.id, withActivity]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return { permits, activity, error, reload, loading: permits === null };
}

/** Human label for a permit.* audit action. */
export function describeActivity(a: PermitActivity): { title: string; sub: string } {
  const by = (a.detail.by as string) ?? "Someone";
  const permit = (a.detail.permit as string) ?? "a permit";
  switch (a.action) {
    case "permit.create":
      return { title: `${by} created ${permit}`, sub: `${a.detail.permissions ?? 0} permissions` };
    case "permit.update": {
      const fields = Array.isArray(a.detail.fields) ? (a.detail.fields as string[]) : [];
      return { title: `${by} updated ${permit}`, sub: fields.length ? `Changed ${fields.join(", ")}` : "Updated" };
    }
    case "permit.delete":
      return { title: `${by} deleted ${permit}`, sub: "Permit removed" };
    default:
      return { title: `${by} · ${permit}`, sub: a.action };
  }
}
