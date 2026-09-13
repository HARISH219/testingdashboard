"use client";
import { ConfigPage } from "@/components/dashboard/config-page";

export default function Page() {
  return (
    <ConfigPage
      moduleKey="media"
      defaults={{ channelId: "", allowLinks: false, bypassRoles: [] }}
      sections={[
        {
          title: "Media-only channel",
          description: "Only allow images and attachments in the selected channel.",
          fields: [
            { key: "channelId", label: "Media channel", type: "channel" },
            { key: "allowLinks", label: "Allow links", type: "switch" },
            { key: "bypassRoles", label: "Bypass roles", type: "roles", description: "These roles can post normally." },
          ],
        },
      ]}
    />
  );
}
